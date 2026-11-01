import { pageMeta } from "@/lib/metadata";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileVideo, Loader2, UploadCloud, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { extractWavFromVideo } from "@/lib/audio";
import { ACCEPTED_VIDEO_TYPES, creditsForDuration, MAX_AUDIO_SECONDS, MAX_VIDEO_BYTES } from "@/lib/credits";
import { walletQuery } from "@/lib/api/queries";
import { transcribeAudioClient } from "@/lib/transcription/client-transcribe";
import { compressVideoIfNeeded } from "@/lib/video-compressor";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => pageMeta("Upload video", "Upload a private video up to five minutes for Telugu or English captions."),
  component: UploadPage,
});

type Stage = "idle" | "reading" | "optimizing" | "uploading" | "transcribing";
const STAGE_TEXT: Record<Stage, string> = {
  idle: "",
  reading: "Reading audio from your video...",
  optimizing: "Optimizing video size for fast cloud upload...",
  uploading: "Uploading securely to cloud storage...",
  transcribing: "AI is writing your captions with word-level timing...",
};

const LANGS = [
  { v: "te", label: "Telugu" },
  { v: "mixed", label: "Telugu + English" },
  { v: "en", label: "English" },
] as const;

function UploadPage() {
  const { user } = Route.useRouteContext();
  const { data: balance } = useQuery(walletQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<"te" | "mixed" | "en">("te");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [optimizingDetail, setOptimizingDetail] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function pick(f: File | undefined) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    const isAcceptedExt = ext && ["mp4", "mov", "webm", "mkv", "m4v"].includes(ext);
    if (!ACCEPTED_VIDEO_TYPES.includes(f.type) && !isAcceptedExt) {
      toast.error("Please choose an MP4, MOV, WebM or MKV video.");
      return;
    }
    if (f.size > MAX_VIDEO_BYTES) {
      toast.error("Video must be under 200 MB.");
      return;
    }
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (v.duration > MAX_AUDIO_SECONDS) {
        toast.error("Video must be 5 minutes or shorter.");
        return;
      }
      setDuration(v.duration);
      setFile(f);
      setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 120));
    };
    v.onerror = () => toast.error("We could not read this video.");
    v.src = url;
  }

  const cost = duration ? creditsForDuration(duration) : 0;
  const enough = balance !== undefined && balance >= cost;
  const busy = stage !== "idle";

  async function submit() {
    if (!file || !duration || !title.trim()) return;
    try {
      setStage("reading");
      setProgress(10);
      const { wav } = await extractWavFromVideo(file);

      // 1. Optimize if over 45 MB to stay comfortably within free storage limit
      let fileToUpload = file;
      if (file.size > 45 * 1024 * 1024) {
        setStage("optimizing");
        setProgress(20);
        fileToUpload = await compressVideoIfNeeded(file, (p) => {
          setOptimizingDetail(`${p.originalSizeMb} MB ➔ ~28 MB`);
          setProgress(Math.round(20 + (p.percent / 100) * 35));
        });
      }

      setStage("uploading");
      setProgress(60);
      const id = crypto.randomUUID();
      const ext = fileToUpload.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const videoPath = `${user.id}/${id}/video.${ext}`;

      // 2. Upload video file directly to private Supabase Storage bucket
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(videoPath, fileToUpload, {
          contentType: fileToUpload.type || "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message || "Storage error"}`);
      }

      setProgress(55);

      // 2. Create the project directly in Supabase
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({
          id,
          user_id: user.id,
          title: title.trim(),
          language,
          storage_path: videoPath,
          duration_seconds: Number(duration.toFixed(2)),
          style_preset: "bold-pop",
        })
        .select("id")
        .single();

      if (projError || !project) {
        console.error("Project creation error:", projError);
        throw new Error(projError?.message || "Could not create project.");
      }

      // 3. Deduct / reserve credits atomically
      if (cost > 0) {
        const { error: rpcErr } = await supabase.rpc("spend_user_credit", {
          _kind: "reserve",
          _amount: -cost,
          _reference: project.id,
          _note: `Transcription (${cost} min)`,
        });
        if (rpcErr) {
          console.warn("spend_user_credit note:", rpcErr);
          await supabase.rpc("apply_credit", {
            _user_id: user.id,
            _kind: "reserve",
            _amount: -cost,
            _reference: project.id,
            _note: `Transcription (${cost} min)`,
          });
        }
      }

      setStage("transcribing");
      setProgress(75);

      // 4. Run AI speech recognition
      const result = await transcribeAudioClient({ wavBlob: wav, language });

      setProgress(90);

      // 5. Save the generated transcripts directly into Supabase
      const { error: transError } = await supabase.from("transcripts").upsert({
        project_id: project.id,
        user_id: user.id,
        language: result.language,
        segments: result.segments as any,
        timing_source: "provider",
      });

      if (transError) {
        console.warn("Transcripts save notice:", transError);
      }

      // 6. Record transcription job
      await supabase.from("transcription_jobs").insert({
        project_id: project.id,
        user_id: user.id,
        status: "completed",
        credits_reserved: cost,
        provider: "groq-whisper",
      });

      void qc.invalidateQueries({ queryKey: ["wallet"] });
      void qc.invalidateQueries({ queryKey: ["projects"] });

      setProgress(100);
      toast.success("Captions are ready!");
      void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong during caption creation");
      setStage("idle");
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <PageHeader title="Upload a video" subtitle="MP4, MOV, WebM or MKV • up to 200 MB • up to 5 minutes" />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50"
          }`}
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <UploadCloud className="size-6" />
          </span>
          <p className="mt-5 font-semibold">Drop your video here</p>
          <p className="mt-1 text-sm text-muted-foreground">or tap to choose a file</p>
        </button>
      ) : (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <FileVideo className="size-8 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB • {Math.floor((duration ?? 0) / 60)}m{" "}
                {Math.round((duration ?? 0) % 60)}s
              </p>
            </div>
            {!busy && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  setDuration(null);
                }}
              >
                <X />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Project name</Label>
            <Input id="title" value={title} maxLength={120} disabled={busy} onChange={(e) => setTitle(e.target.value)} />
            {!title.trim() && <p className="text-xs text-destructive">Please add a name.</p>}
          </div>

          <div className="space-y-2">
            <Label>Spoken language</Label>
            <RadioGroup
              value={language}
              onValueChange={(v) => setLanguage(v as typeof language)}
              className="grid grid-cols-3 gap-2"
              disabled={busy}
            >
              {LANGS.map((l) => (
                <Label
                  key={l.v}
                  htmlFor={`lang-${l.v}`}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-center text-sm ${
                    language === l.v ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <RadioGroupItem id={`lang-${l.v}`} value={l.v} className="sr-only" />
                  {l.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted p-4 text-sm">
            <span>
              Cost: <b>{cost} credits</b>
            </span>
            <span className="text-muted-foreground">Balance: {balance ?? "..."}</span>
          </div>

          {busy && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {STAGE_TEXT[stage]}
                {stage === "optimizing" && optimizingDetail ? ` (${optimizingDetail})` : ""}
              </p>
            </div>
          )}

          {enough ? (
            <Button variant="hero" size="lg" className="w-full" disabled={busy || !title.trim()} onClick={submit}>
              {busy ? <Loader2 className="animate-spin" /> : null} Create captions
            </Button>
          ) : (
            <Button variant="hero" size="lg" className="w-full" onClick={() => navigate({ to: "/billing" })}>
              Not enough credits — buy more
            </Button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Info, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaptionOverlay } from "@/components/studio/caption-overlay";
import { SegmentEditor } from "@/components/studio/segment-editor";
import { studioQuery } from "@/lib/api/queries";
import { presetStyle } from "@/lib/captions/presets";
import { captionStyleSchema, type CaptionStyle } from "@/lib/captions/style-schema";
import { CaptionStylePanel } from "@/components/studio/caption-style-panel";
import { RenderSettings } from "@/components/studio/render-settings";
import { EDITOR_FONT_URL } from "@/lib/captions/font-registry";
import { generateAss, ASS_LIMITATIONS } from "@/lib/captions/ass-generator";
import { pageMeta } from "@/lib/metadata";
import { toSrt, toTxt, toVtt } from "@/lib/captions/format";
import type { ScriptMode, TranscriptSegment } from "@/lib/captions/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getGroqKey } from "@/lib/transcription/client-transcribe";

export const Route = createFileRoute("/_authenticated/studio/$projectId")({
  head: () => ({ ...pageMeta("Caption Studio", "Edit synchronized Telugu captions, customize styles and prepare secure MP4 exports."), links: [{ rel: "stylesheet", href: EDITOR_FONT_URL }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(studioQuery(params.projectId)),
  component: Studio,
});

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Studio() {
  const { projectId } = Route.useParams();
  const { data } = useSuspenseQuery(studioQuery(projectId));
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [script, setScript] = useState<ScriptMode>("telugu");
  const [telugu, setTelugu] = useState<TranscriptSegment[]>(data.segments ?? []);
  const [roman, setRoman] = useState<TranscriptSegment[] | null>(data.romanized);
  const [preset, setPreset] = useState(presetStyle(data.project.style_preset).presetId);
  const [style, setStyle] = useState<CaptionStyle>(() => {
    const parsed = captionStyleSchema.safeParse(data.project.caption_style);
    return parsed.success ? parsed.data : presetStyle(data.project.style_preset);
  });
  const [past, setPast] = useState<CaptionStyle[]>([]);
  const [future, setFuture] = useState<CaptionStyle[]>([]);
  const [renderOpen, setRenderOpen] = useState(false);
  function changeStyle(next: CaptionStyle) { setPast((p) => [...p.slice(-49), style]); setFuture([]); setStyle(next); setPreset(next.presetId); setDirty(true); }
  function undoStyle() { const prev = past.at(-1); if (!prev) return; setFuture((f) => [...f, style]); setPast((p) => p.slice(0, -1)); setStyle(prev); setPreset(prev.presetId); setDirty(true); }
  function redoStyle() { const next = future.at(-1); if (!next) return; setPast((p) => [...p, style]); setFuture((f) => f.slice(0, -1)); setStyle(next); setPreset(next.presetId); setDirty(true); }
  const [time, setTime] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [transcriptDirty, setTranscriptDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  const segments = script === "roman" && roman ? roman : telugu;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tick = () => setTime(v.currentTime);
    v.addEventListener("timeupdate", tick);
    v.addEventListener("seeked", tick);
    return () => { v.removeEventListener("timeupdate", tick); v.removeEventListener("seeked", tick); };
  }, []);

  const seek = useCallback((t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  }, []);

  const update = useCallback(
    (s: TranscriptSegment) => {
      const setter = script === "roman" ? setRoman : setTelugu;
      setter((prev: TranscriptSegment[] | null) => (prev ?? []).map((x: TranscriptSegment) => (x.id === s.id ? s : x)));
      setDirty(true);
      setTranscriptDirty(true);
    },
    [script],
  );

  async function switchScript(next: ScriptMode) {
    if (next === "roman" && !roman) {
      setConverting(true);
      try {
        const words = telugu.flatMap((s) => s.words.map((w) => w.text));
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getGroqKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            messages: [
              {
                role: "system",
                content:
                  "Convert the list of Telugu words to casual Romanized Telugu (e.g. 'నమస్కారం' -> 'namaskaram'). Keep English words unchanged. Respond with JSON: {\"words\": [\"word1\", ...]} with the exact same count and order.",
              },
              { role: "user", content: JSON.stringify(words) },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error?.message || `Transliteration failed (${res.status})`);
        }

        const out = await res.json();
        if (!out.choices?.[0]?.message?.content) {
          throw new Error("Could not parse transliterated text.");
        }
        const rawContent = (out.choices[0].message.content || "").trim();
        const jsonText = rawContent
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "")
          .trim();
        const parsed = JSON.parse(jsonText);
        const transliterated: string[] = Array.isArray(parsed.words)
          ? parsed.words
          : Array.isArray(parsed)
            ? parsed
            : [];
        let i = 0;
        const romanized: TranscriptSegment[] = telugu.map((s) => {
          const ws = s.words.map((w) => ({ ...w, text: transliterated[i++] || w.text }));
          return { ...s, words: ws, text: ws.map((w) => w.text).join(" ") };
        });
        setRoman(romanized);
        await supabase.from("transcripts").update({ romanized_segments: romanized as any }).eq("project_id", projectId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not convert");
        setConverting(false);
        return;
      }
      setConverting(false);
    }
    setScript(next);
  }

  async function onSave() {
    setSaving(true);
    try {
      const { error: projErr } = await supabase
        .from("projects")
        .update({
          style_preset: preset,
          caption_style: style as any,
        })
        .eq("id", projectId);
      if (projErr) throw projErr;

      if (transcriptDirty) {
        const updatePayload: Record<string, any> = { segments: telugu };
        if (roman) updatePayload.romanized_segments = roman;
        const { error: transErr } = await supabase
          .from("transcripts")
          .update(updatePayload)
          .eq("project_id", projectId);
        if (transErr) throw transErr;
      }

      setDirty(false);
      setTranscriptDirty(false);
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["studio", projectId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const base = data.project.title.replace(/[^\w\u0C00-\u0C7F -]+/g, "").trim() || "captions";
  const suffix = script === "roman" ? "-roman" : "";

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back"><Link to="/dashboard"><ArrowLeft /></Link></Button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold sm:text-2xl">{data.project.title}</h1>
        <Button variant="outline" onClick={onSave} disabled={!dirty || saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Save" : "Saved"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="hero"><Download /> Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => download(`${base}${suffix}.srt`, toSrt(segments), "application/x-subrip")}>SRT (YouTube, editors)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => download(`${base}${suffix}.vtt`, toVtt(segments), "text/vtt")}>VTT (web players)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => download(`${base}${suffix}.txt`, toTxt(segments), "text/plain")}>TXT (plain text)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { try { download(`${base}${suffix}.ass`, generateAss(segments, style, 1920, 1080, Number(data.project.duration_seconds)), "text/plain"); toast.info(ASS_LIMITATIONS); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not export ASS"); } }}>ASS (rendering subtitles)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenderOpen(true)}>MP4 with captions</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-card [container-type:inline-size]">
            {data.videoUrl ? (
              <video ref={videoRef} src={data.videoUrl} controls playsInline className="max-h-[60vh] w-full bg-background" />
            ) : (
              <div className="grid aspect-video place-items-center text-sm text-muted-foreground">Video not available</div>
            )}
            <CaptionOverlay segments={segments} time={time} presetId={preset} style={style} />
          </div>

          <CaptionStylePanel style={style} onChange={changeStyle} undo={undoStyle} redo={redoStyle} canUndo={past.length > 0} canRedo={future.length > 0} />

          {data.timingSource === "estimated" && (
            <p className="flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" /> Timing is estimated by AI from the audio. Adjust any line with the time boxes.
            </p>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <Tabs value={script} onValueChange={(v) => void switchScript(v as ScriptMode)}>
              <TabsList>
                <TabsTrigger value="telugu" className="font-telugu">తెలుగు</TabsTrigger>
                <TabsTrigger value="roman" disabled={converting}>
                  {converting ? <Loader2 className="size-3.5 animate-spin" /> : null} Roman
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">{segments.length} lines</span>
          </div>
          <div className="space-y-2">
            {segments.map((s) => (
              <SegmentEditor key={s.id} segment={s} duration={Number(data.project.duration_seconds)} active={time >= s.start && time <= s.end} onSeek={seek} onChange={update} />
            ))}
          </div>
        </div>
      </div>
      <RenderSettings
        projectId={projectId}
        open={renderOpen}
        onOpenChange={setRenderOpen}
        videoUrl={data.videoUrl}
        storagePath={data.project.storage_path}
        title={data.project.title}
        segments={segments}
        style={style}
        duration={Number(data.project.duration_seconds || 0)}
      />
    </div>
  );
}

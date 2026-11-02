import { useState, useRef } from "react";
import { CheckCircle2, Film, Loader2, Download, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { CaptionStyle } from "@/lib/captions/style-schema";
import type { TranscriptSegment } from "@/lib/captions/types";
import { renderVideoInBrowser } from "@/lib/rendering/client-video-renderer";

interface RenderSettingsProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string | null;
  storagePath?: string | null;
  title: string;
  segments: TranscriptSegment[];
  style: CaptionStyle;
  duration: number;
}

export function RenderSettings({
  open,
  onOpenChange,
  videoUrl,
  storagePath,
  title,
  segments,
  style,
  duration,
}: RenderSettingsProps) {
  const [resolution, setResolution] = useState<"1080p" | "720p" | "original">("1080p");
  const [status, setStatus] = useState<"idle" | "rendering" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stageMessage, setStageMessage] = useState<string>("Rendering frames and synchronizing audio on your device...");

  const abortRef = useRef<AbortController | null>(null);

  const formatClock = (seconds: number) => {
    const s = Math.floor(seconds % 60);
    const m = Math.floor(seconds / 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartExport = async () => {
    if (!videoUrl) {
      toast.error("Video is not available for export.");
      return;
    }

    setStatus("rendering");
    setProgress(0);
    setCurrentSec(0);
    setErrorMessage(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { blob, ext } = await renderVideoInBrowser({
        videoUrl,
        storagePath,
        segments,
        style,
        duration,
        resolution,
        signal: controller.signal,
        onProgress: (pct, sec, msg) => {
          setProgress(pct);
          setCurrentSec(sec);
          if (msg) setStageMessage(msg);
        },
      });

      const cleanTitle =
        title.replace(/[^\w\u0C00-\u0C7F -]+/g, "").trim() || "captioned_video";
      const fileName = `${cleanTitle}_captions.${ext}`;
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloadFileName(fileName);
      setStatus("completed");

      // Auto trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Video rendered and downloaded!");
    } catch (err: unknown) {
      if ((err as Error)?.message?.includes("cancelled")) {
        setStatus("idle");
        toast.info("Export cancelled.");
      } else {
        console.error("Video render failure:", err);
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during rendering.",
        );
      }
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setStatus("idle");
  };

  const handleClose = (nextOpen: boolean) => {
    if (status === "rendering" && !nextOpen) {
      if (confirm("Cancel ongoing video export?")) {
        handleCancel();
        onOpenChange(false);
      }
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="size-5 text-primary" />
            {status === "idle" && "Export Video with Captions"}
            {status === "rendering" && "Burning Captions..."}
            {status === "completed" && "Video Ready!"}
            {status === "error" && "Export Failed"}
          </DialogTitle>
          <DialogDescription>
            {status === "idle" &&
              "Burn styled synchronized captions directly into your MP4 video for Instagram Reels, YouTube Shorts, or TikTok."}
            {status === "rendering" &&
              "Rendering frames and synchronizing audio on your device. Please keep this tab active."}
            {status === "completed" &&
              "Your video has been rendered with custom captions and downloaded."}
            {status === "error" && "There was an issue processing your video."}
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <div className="space-y-5 py-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Output Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "1080p", label: "1080p", desc: "Full HD (Reels)" },
                    { id: "720p", label: "720p", desc: "Fast export" },
                    { id: "original", label: "Original", desc: "Source size" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setResolution(r.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      resolution === r.id
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="font-bold">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-accent/30 p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Video Duration:</span>
                <span className="font-semibold text-foreground">
                  {formatClock(duration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Captions:</span>
                <span className="font-semibold text-foreground">
                  {segments.length} lines ({style.presetId})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Server Cost:</span>
                <span className="font-semibold text-emerald-500">
                  ₹0 (Client-side fast render)
                </span>
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full text-base font-semibold"
              onClick={handleStartExport}
            >
              <Film className="mr-2 size-4" /> Start Export
            </Button>
          </div>
        )}

        {status === "rendering" && (
          <div className="space-y-4 py-4 text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="size-10 animate-spin text-primary" />
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold">{progress}%</div>
              <p className="text-xs font-medium text-foreground/90">{stageMessage}</p>
              <p className="text-[11px] text-muted-foreground">
                Processed {formatClock(currentSec)} of {formatClock(duration)}
              </p>
            </div>

            <Progress value={progress} className="h-2 w-full" />

            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel Export
              </Button>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-7" />
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Export Completed!
              </p>
              <p className="text-xs text-muted-foreground">
                Your video file has been saved to your downloads.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {downloadUrl && downloadFileName && (
                <Button variant="outline" className="flex-1" asChild>
                  <a href={downloadUrl} download={downloadFileName}>
                    <Download className="mr-2 size-4" /> Download Again
                  </a>
                </Button>
              )}
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" />
            </div>

            <p className="text-sm text-destructive">{errorMessage}</p>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStatus("idle")}
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

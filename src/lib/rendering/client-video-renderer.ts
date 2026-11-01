import type { CaptionStyle } from "@/lib/captions/style-schema";
import type { TranscriptSegment } from "@/lib/captions/types";
import { drawCaptionsOnCanvas } from "./canvas-renderer";

export interface RenderOptions {
  videoUrl: string;
  segments: TranscriptSegment[];
  style: CaptionStyle;
  duration: number;
  resolution: "original" | "1080p" | "720p";
  onProgress: (percent: number, currentSec: number) => void;
  signal?: AbortSignal;
}

export function getSupportedMimeType(): { mimeType: string; ext: string } {
  const candidates = [
    { mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', ext: "mp4" },
    { mime: 'video/mp4; codecs="avc1.4d401f, mp4a.40.2"', ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: 'video/webm; codecs="vp9,opus"', ext: "webm" },
    { mime: 'video/webm; codecs="vp8,opus"', ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];

  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "video/mp4", ext: "mp4" };
  }

  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c.mime)) {
        return { mimeType: c.mime, ext: c.ext };
      }
    } catch {
      // Ignore checks if browser throws
    }
  }

  return { mimeType: "video/webm", ext: "webm" };
}

export async function renderVideoInBrowser({
  videoUrl,
  segments,
  style,
  duration,
  resolution,
  onProgress,
  signal,
}: RenderOptions): Promise<{ blob: Blob; ext: string }> {
  // Wait for Google fonts to be ready
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed if font loading promise fails
    }
  }

  return new Promise(async (resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Export cancelled."));
      return;
    }

    let localBlobUrl: string | null = null;
    let effectiveUrl = videoUrl;

    // Pre-fetch video as a local blob if accessible to eliminate network buffering stutter
    try {
      const resp = await fetch(videoUrl);
      if (resp.ok) {
        const vBlob = await resp.blob();
        localBlobUrl = URL.createObjectURL(vBlob);
        effectiveUrl = localBlobUrl;
      }
    } catch {
      // Fall back to direct videoUrl if fetch fails
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.preload = "auto";
    video.src = effectiveUrl;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) {
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      reject(new Error("Could not initialize 2D canvas context."));
      return;
    }

    let audioCtx: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let rvfcId: number | null = null;
    let rafId: number | null = null;
    let isTerminated = false;
    const chunks: BlobPart[] = [];

    const cleanup = () => {
      isTerminated = true;
      if (rvfcId !== null && "cancelVideoFrameCallback" in video) {
        (video as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(rvfcId);
        rvfcId = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      if (audioCtx && audioCtx.state !== "closed") {
        void audioCtx.close();
      }
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
        localBlobUrl = null;
      }
    };

    if (signal) {
      signal.addEventListener("abort", () => {
        cleanup();
        reject(new Error("Export cancelled."));
      });
    }

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video source for rendering."));
    };

    video.onloadedmetadata = async () => {
      try {
        const origW = video.videoWidth || 1080;
        const origH = video.videoHeight || 1920;

        let targetW = origW;
        let targetH = origH;

        if (resolution === "1080p") {
          if (origH >= origW) {
            targetW = 1080;
            targetH = Math.round((1080 * origH) / origW);
          } else {
            targetH = 1080;
            targetW = Math.round((1080 * origW) / origH);
          }
        } else if (resolution === "720p") {
          if (origH >= origW) {
            targetW = 720;
            targetH = Math.round((720 * origH) / origW);
          } else {
            targetH = 720;
            targetW = Math.round((720 * origW) / origH);
          }
        }

        // Even dimensions for hardware encoders
        targetW = targetW % 2 === 0 ? targetW : targetW + 1;
        targetH = targetH % 2 === 0 ? targetH : targetH + 1;

        canvas.width = targetW;
        canvas.height = targetH;

        // Route audio through AudioContext to record without playing through speakers
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioCtxClass();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaElementSource(video);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);

        const canvasStream = canvas.captureStream(30);
        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }

        const { mimeType, ext } = getSupportedMimeType();
        // Optimal bitrates for fast stutter-free client-side hardware encoding
        const videoBitrate = targetW >= 1080 ? 4_500_000 : 2_500_000;

        recorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: videoBitrate,
          audioBitsPerSecond: 128_000,
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          cleanup();
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve({ blob: finalBlob, ext });
        };

        recorder.onerror = (e) => {
          cleanup();
          reject(new Error(`Recording error: ${String((e as unknown as { error?: Error }).error || e)}`));
        };

        const totalDuration = duration || video.duration || 1;

        const finishRecording = () => {
          if (isTerminated) return;
          isTerminated = true;
          onProgress(100, totalDuration);
          setTimeout(() => {
            if (recorder && recorder.state !== "inactive") {
              recorder.stop();
            }
          }, 300);
        };

        const drawFrame = () => {
          if (isTerminated || signal?.aborted) return;

          // Check if video reached end
          if (video.ended || (video.currentTime >= totalDuration - 0.05 && totalDuration > 0)) {
            finishRecording();
            return;
          }

          // 1. Draw video frame
          ctx.drawImage(video, 0, 0, targetW, targetH);

          // 2. Draw active captions with styling
          drawCaptionsOnCanvas(ctx, targetW, targetH, segments, video.currentTime, style);

          // 3. Update progress
          const pct = Math.min(99, Math.round((video.currentTime / totalDuration) * 100));
          onProgress(pct, video.currentTime);
        };

        const scheduleFrame = () => {
          if (isTerminated || video.ended || signal?.aborted) return;

          if ("requestVideoFrameCallback" in video) {
            rvfcId = (
              video as unknown as {
                requestVideoFrameCallback: (cb: () => void) => number;
              }
            ).requestVideoFrameCallback(() => {
              drawFrame();
              scheduleFrame();
            });
          } else {
            rafId = requestAnimationFrame(() => {
              drawFrame();
              scheduleFrame();
            });
          }
        };

        // Reset to beginning before starting
        video.currentTime = 0;
        await new Promise<void>((r) => {
          if (video.readyState >= 2) {
            r();
          } else {
            video.oncanplay = () => r();
          }
        });

        recorder.start(500); // chunk every 500ms
        await video.play();
        scheduleFrame();

        video.onended = () => {
          finishRecording();
        };
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error("Failed to start video rendering"));
      }
    };
  });
}

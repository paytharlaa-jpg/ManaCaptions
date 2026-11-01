import { getSupportedMimeType } from "@/lib/rendering/client-video-renderer";

export interface CompressProgress {
  percent: number;
  currentSec: number;
  totalSec: number;
  originalSizeMb: number;
}

/**
 * Checks if the video file exceeds Supabase's 45 MB safe limit.
 * If <= 45 MB, returns the original file untouched immediately.
 * If > 45 MB (up to 200 MB), optimizes resolution and bitrate in the browser
 * to produce a crisp ~28 MB file that uploads smoothly without server fees.
 */
export async function compressVideoIfNeeded(
  file: File,
  onProgress?: (p: CompressProgress) => void,
  signal?: AbortSignal,
): Promise<File> {
  const MAX_RAW_BYTES = 45 * 1024 * 1024; // 45 MB

  // 1. If already under 45 MB, no optimization needed!
  if (file.size <= MAX_RAW_BYTES) {
    return file;
  }

  const originalSizeMb = Number((file.size / (1024 * 1024)).toFixed(1));

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Optimization cancelled."));
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.preload = "auto";
    video.muted = false; // Must be false for Web Audio destination to capture audio track
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Canvas context could not be created."));
      return;
    }

    let audioCtx: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let animationId = 0;
    const chunks: BlobPart[] = [];

    const cleanup = () => {
      cancelAnimationFrame(animationId);
      URL.revokeObjectURL(objectUrl);
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      if (audioCtx && audioCtx.state !== "closed") {
        void audioCtx.close();
      }
    };

    if (signal) {
      signal.addEventListener("abort", () => {
        cleanup();
        reject(new Error("Optimization cancelled."));
      });
    }

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read video file for optimization."));
    };

    video.onloadedmetadata = async () => {
      try {
        const origW = video.videoWidth || 1080;
        const origH = video.videoHeight || 1920;
        const duration = video.duration || 1;

        // Scale to 720p max dimension (optimal for mobile & social)
        let targetW = origW;
        let targetH = origH;
        const maxDim = 1280;

        if (origW > maxDim || origH > maxDim) {
          if (origW >= origH) {
            targetW = maxDim;
            targetH = Math.round((maxDim * origH) / origW);
          } else {
            targetH = maxDim;
            targetW = Math.round((maxDim * origW) / origH);
          }
        }

        // Even dimensions required for standard encoders
        targetW = targetW % 2 === 0 ? targetW : targetW + 1;
        targetH = targetH % 2 === 0 ? targetH : targetH + 1;

        canvas.width = targetW;
        canvas.height = targetH;

        // Target file size: ~28 MB to be well under 50 MB limit
        const targetBits = 28 * 1024 * 1024 * 8;
        const targetBitrate = Math.min(
          2_800_000,
          Math.max(600_000, Math.floor(targetBits / duration)),
        );

        // Setup AudioContext without playing to computer speakers
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
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

        recorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: targetBitrate,
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          cleanup();
          const finalBlob = new Blob(chunks, { type: mimeType });
          const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
          const compressedFile = new File([finalBlob], newName, {
            type: mimeType,
          });
          resolve(compressedFile);
        };

        recorder.onerror = () => {
          cleanup();
          reject(new Error("Video optimization failed."));
        };

        recorder.start(500);

        await video.play();

        const renderFrame = () => {
          if (video.ended || video.paused || signal?.aborted) return;
          ctx.drawImage(video, 0, 0, targetW, targetH);

          const pct = Math.min(
            99,
            Math.round((video.currentTime / duration) * 100),
          );
          onProgress?.({
            percent: pct,
            currentSec: video.currentTime,
            totalSec: duration,
            originalSizeMb,
          });

          animationId = requestAnimationFrame(renderFrame);
        };

        animationId = requestAnimationFrame(renderFrame);

        video.onended = () => {
          onProgress?.({
            percent: 100,
            currentSec: duration,
            totalSec: duration,
            originalSizeMb,
          });
          cancelAnimationFrame(animationId);
          setTimeout(() => {
            if (recorder && recorder.state !== "inactive") {
              recorder.stop();
            }
          }, 300);
        };
      } catch (err) {
        cleanup();
        reject(
          err instanceof Error
            ? err
            : new Error("Failed during video optimization."),
        );
      }
    };
  });
}

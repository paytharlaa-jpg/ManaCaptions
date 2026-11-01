import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { supabase } from "@/integrations/supabase/client";
import type { CaptionStyle } from "@/lib/captions/style-schema";
import type { TranscriptSegment } from "@/lib/captions/types";
import { drawCaptionsOnCanvas } from "./canvas-renderer";

export interface RenderOptions {
  videoUrl: string;
  storagePath?: string | null;
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

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.001) {
      resolve();
      return;
    }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }
    }, 400);

    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        video.removeEventListener("seeked", onSeeked);
        if ("requestVideoFrameCallback" in video) {
          (
            video as unknown as {
              requestVideoFrameCallback: (cb: () => void) => number;
            }
          ).requestVideoFrameCallback(() => {
            resolve();
          });
        } else {
          resolve();
        }
      }
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

async function getSupportedVideoCodec(
  width: number,
  height: number,
  bitrate: number,
): Promise<string | null> {
  if (typeof VideoEncoder === "undefined") return null;
  const candidates = [
    "avc1.4d002a", // Main Profile Level 4.2
    "avc1.64002a", // High Profile Level 4.2
    "avc1.42001f", // Baseline Profile Level 3.1
    "avc1.4d001f",
    "avc1.42e01e",
  ];
  for (const c of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: c,
        width,
        height,
        bitrate,
        framerate: 30,
      });
      if (support.supported) return c;
    } catch {
      // try next
    }
  }
  return null;
}

async function getSupportedAudioCodec(sampleRate: number): Promise<string | null> {
  if (typeof AudioEncoder === "undefined") return null;
  try {
    const support = await AudioEncoder.isConfigSupported({
      codec: "mp4a.40.2",
      numberOfChannels: 2,
      sampleRate,
      bitrate: 128_000,
    });
    if (support.supported) return "mp4a.40.2";
  } catch {
    // unsupported
  }
  return null;
}

/**
 * Modern In-Browser Deterministic Frame-by-Frame Exporter
 * Uses WebCodecs VideoEncoder + mp4-muxer with guaranteed 1-second keyframes (GOP = 30).
 * Produces rock-solid, Constant Frame Rate 30.00 FPS MP4 video with zero stutter or freezing.
 */
async function renderWithWebCodecs({
  videoUrl,
  storagePath,
  segments,
  style,
  duration,
  resolution,
  onProgress,
  signal,
}: RenderOptions): Promise<{ blob: Blob; ext: string }> {
  // 1. Download video directly via Supabase SDK to eliminate CORS restrictions
  let videoBlob: Blob | null = null;
  if (storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from("videos")
        .download(storagePath);
      if (!error && data) {
        videoBlob = data;
      }
    } catch (e) {
      console.warn("Supabase storage direct download failed:", e);
    }
  }

  // Fallback to direct fetch if storagePath is not available
  if (!videoBlob) {
    const resp = await fetch(videoUrl);
    if (!resp.ok) throw new Error(`Could not fetch video file: ${resp.statusText}`);
    videoBlob = await resp.blob();
  }

  const arrayBuffer = await videoBlob.arrayBuffer();

  if (signal?.aborted) throw new Error("Export cancelled.");

  // 2. Decode audio buffer for audio track muxing
  let audioBuffer: AudioBuffer | null = null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioCtx = new AudioCtxClass();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    void audioCtx.close();
  } catch (err) {
    console.warn("Could not decode audio track (video may be silent):", err);
  }

  // 3. Load video into memory
  const localBlobUrl = URL.createObjectURL(videoBlob);
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.muted = true;
  video.src = localBlobUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load video metadata"));
    });

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

    targetW = targetW % 2 === 0 ? targetW : targetW + 1;
    targetH = targetH % 2 === 0 ? targetH : targetH + 1;

    const videoBitrate = targetW >= 1080 ? 4_500_000 : 2_500_000;
    const videoCodec = await getSupportedVideoCodec(targetW, targetH, videoBitrate);
    if (!videoCodec) {
      throw new Error("WebCodecs VideoEncoder is not supported in this browser.");
    }

    const audioCodec =
      audioBuffer && (await getSupportedAudioCodec(audioBuffer.sampleRate));

    // 4. Initialize MP4 Muxer with fast-start metadata
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: "avc",
        width: targetW,
        height: targetH,
        frameRate: 30,
      },
      audio:
        audioCodec && audioBuffer
          ? {
              codec: "aac",
              numberOfChannels: 2,
              sampleRate: audioBuffer.sampleRate,
            }
          : undefined,
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    });

    // 5. Initialize WebCodecs VideoEncoder
    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error("VideoEncoder error:", e),
    });

    videoEncoder.configure({
      codec: videoCodec,
      width: targetW,
      height: targetH,
      bitrate: videoBitrate,
      framerate: 30,
    });

    // 6. Encode Audio Track if present
    if (audioCodec && audioBuffer) {
      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error("AudioEncoder error:", e),
      });

      audioEncoder.configure({
        codec: audioCodec,
        numberOfChannels: 2,
        sampleRate: audioBuffer.sampleRate,
        bitrate: 128_000,
      });

      const sampleRate = audioBuffer.sampleRate;
      const totalSamples = audioBuffer.length;
      const CHUNK_SIZE = 2048;
      const ch0 = audioBuffer.getChannelData(0);
      const ch1 =
        audioBuffer.numberOfChannels > 1
          ? audioBuffer.getChannelData(1)
          : ch0;

      for (let offset = 0; offset < totalSamples; offset += CHUNK_SIZE) {
        if (signal?.aborted) throw new Error("Export cancelled.");
        const currentChunkSize = Math.min(CHUNK_SIZE, totalSamples - offset);
        const chunkData = new Float32Array(currentChunkSize * 2);

        // f32-planar format: all Channel 0 samples followed by Channel 1 samples
        for (let s = 0; s < currentChunkSize; s++) {
          chunkData[s] = ch0[offset + s];
          chunkData[currentChunkSize + s] = ch1[offset + s];
        }

        const timestamp = Math.round((offset / sampleRate) * 1_000_000);
        const audioData = new AudioData({
          format: "f32-planar",
          sampleRate,
          numberOfChannels: 2,
          numberOfFrames: currentChunkSize,
          timestamp,
          data: chunkData,
        });

        audioEncoder.encode(audioData);
        audioData.close();
      }

      await audioEncoder.flush();
    }

    // 7. Render Video Frames deterministically frame-by-frame
    const totalDuration = duration || video.duration || 1;
    const fps = 30;
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("Could not initialize 2D canvas context");

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new Error("Export cancelled.");

      const currentTime = i / fps;

      // Seek to exact frame time
      await seekVideo(video, currentTime);

      // Draw video frame
      ctx.drawImage(video, 0, 0, targetW, targetH);

      // Draw active captions
      drawCaptionsOnCanvas(ctx, targetW, targetH, segments, currentTime, style);

      // Presentation timestamp in microseconds
      const timestamp = Math.round(currentTime * 1_000_000);
      // Inject full I-Frame keyframe every 1 second (every 30 frames)
      const isKeyFrame = i % 30 === 0;

      const frame = new VideoFrame(canvas, { timestamp });
      videoEncoder.encode(frame, { keyFrame: isKeyFrame });
      frame.close();

      // Avoid GPU queue backpressure
      if (videoEncoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 10));
      }

      // Progress reporting
      const pct = Math.min(99, Math.round(((i + 1) / totalFrames) * 100));
      onProgress(pct, currentTime);
    }

    await videoEncoder.flush();
    muxer.finalize();

    onProgress(100, totalDuration);

    const finalBlob = new Blob([target.buffer], { type: "video/mp4" });
    return { blob: finalBlob, ext: "mp4" };
  } finally {
    URL.revokeObjectURL(localBlobUrl);
    video.removeAttribute("src");
    video.load();
  }
}

/** Fallback for older browsers without WebCodecs */
async function renderWithMediaRecorderFallback(
  options: RenderOptions,
): Promise<{ blob: Blob; ext: string }> {
  const { videoUrl, segments, style, duration, resolution, onProgress, signal } =
    options;

  return new Promise(async (resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Export cancelled."));
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      reject(new Error("Could not initialize 2D canvas context."));
      return;
    }

    let audioCtx: AudioContext | null = null;
    let recorder: MediaRecorder | null = null;
    let isTerminated = false;
    const chunks: BlobPart[] = [];

    const cleanup = () => {
      isTerminated = true;
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
        reject(new Error("Export cancelled."));
      });
    }

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video source."));
    };

    video.onloadedmetadata = async () => {
      try {
        const origW = video.videoWidth || 1080;
        const origH = video.videoHeight || 1920;

        let targetW = origW;
        let targetH = origH;

        if (resolution === "1080p") {
          targetW = origH >= origW ? 1080 : Math.round((1080 * origW) / origH);
          targetH = origH >= origW ? Math.round((1080 * origH) / origW) : 1080;
        } else if (resolution === "720p") {
          targetW = origH >= origW ? 720 : Math.round((720 * origW) / origH);
          targetH = origH >= origW ? Math.round((720 * origH) / origW) : 720;
        }

        targetW = targetW % 2 === 0 ? targetW : targetW + 1;
        targetH = targetH % 2 === 0 ? targetH : targetH + 1;

        canvas.width = targetW;
        canvas.height = targetH;

        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioCtx = new AudioCtxClass();
        if (audioCtx.state === "suspended") await audioCtx.resume();

        const source = audioCtx.createMediaElementSource(video);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);

        const canvasStream = canvas.captureStream(30);
        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);

        recorder = new MediaRecorder(canvasStream, {
          mimeType: "video/webm",
          videoBitsPerSecond: targetW >= 1080 ? 4_500_000 : 2_500_000,
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          cleanup();
          resolve({ blob: new Blob(chunks, { type: "video/webm" }), ext: "webm" });
        };

        recorder.start(500);
        await video.play();

        const totalDuration = duration || video.duration || 1;
        const drawLoop = () => {
          if (isTerminated || video.ended || signal?.aborted) return;
          ctx.drawImage(video, 0, 0, targetW, targetH);
          drawCaptionsOnCanvas(ctx, targetW, targetH, segments, video.currentTime, style);
          onProgress(
            Math.min(99, Math.round((video.currentTime / totalDuration) * 100)),
            video.currentTime,
          );
          requestAnimationFrame(drawLoop);
        };
        requestAnimationFrame(drawLoop);

        video.onended = () => {
          onProgress(100, totalDuration);
          setTimeout(() => {
            if (recorder && recorder.state !== "inactive") recorder.stop();
          }, 300);
        };
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error("Failed to render video"));
      }
    };
  });
}

/** Primary Export Entry Point */
export async function renderVideoInBrowser(
  options: RenderOptions,
): Promise<{ blob: Blob; ext: string }> {
  // Wait for Google fonts to be ready
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed if font loading promise fails
    }
  }

  // Check if modern WebCodecs is available
  if (typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined") {
    return await renderWithWebCodecs(options);
  }

  // Fallback for browsers without WebCodecs
  return renderWithMediaRecorderFallback(options);
}

import { Muxer, ArrayBufferTarget } from "mp4-muxer";

export interface CompressProgress {
  percent: number;
  currentSec: number;
  totalSec: number;
  originalSizeMb: number;
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.001) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    }, 500);

    const onSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

async function getSupportedVideoCodec(width: number, height: number, bitrate: number): Promise<string | null> {
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
 * Checks if the video file exceeds Supabase's 45 MB safe limit.
 * If <= 45 MB, returns the original file untouched immediately.
 * If > 45 MB (up to 200 MB), uses deterministic WebCodecs + mp4-muxer
 * to produce a pristine, full-30fps, non-laggy ~25 MB MP4 video.
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

  // Check if WebCodecs is available
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") {
    // If browser doesn't have WebCodecs, return file as-is rather than ruining it with MediaRecorder
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();
  if (signal?.aborted) throw new Error("Optimization cancelled.");

  // Decode audio buffer for clean audio track muxing
  let audioBuffer: AudioBuffer | null = null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtxClass();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    void audioCtx.close();
  } catch (err) {
    console.warn("Could not decode audio track for compression:", err);
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.muted = true;
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video metadata for compression"));
    });

    const origW = video.videoWidth || 1080;
    const origH = video.videoHeight || 1920;
    const duration = video.duration || 1;

    // Scale to max 1280px on long dimension to fit comfortably under 45MB while remaining super crisp
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

    targetW = targetW % 2 === 0 ? targetW : targetW + 1;
    targetH = targetH % 2 === 0 ? targetH : targetH + 1;

    // Target ~24 MB to stay safely below 45 MB limit
    const targetBits = 24 * 1024 * 1024 * 8;
    const videoBitrate = Math.min(
      2_600_000,
      Math.max(800_000, Math.floor(targetBits / duration)),
    );

    const videoCodec = await getSupportedVideoCodec(targetW, targetH, videoBitrate);
    if (!videoCodec) {
      // If no supported codec, return original file
      return file;
    }

    const audioCodec =
      audioBuffer && (await getSupportedAudioCodec(audioBuffer.sampleRate));

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
      firstTimestampBehavior: "strict",
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error("Compression VideoEncoder error:", e),
    });

    videoEncoder.configure({
      codec: videoCodec,
      width: targetW,
      height: targetH,
      bitrate: videoBitrate,
      framerate: 30,
    });

    // Encode audio if present
    if (audioCodec && audioBuffer) {
      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error("Compression AudioEncoder error:", e),
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
        if (signal?.aborted) throw new Error("Optimization cancelled.");
        const currentChunkSize = Math.min(CHUNK_SIZE, totalSamples - offset);
        const chunkData = new Float32Array(currentChunkSize * 2);

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

    // Render video frames deterministically (30.00 FPS CFR)
    const fps = 30;
    const totalFrames = Math.max(1, Math.floor(duration * fps));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) throw new Error("Canvas context could not be created.");

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new Error("Optimization cancelled.");

      const currentTime = i / fps;
      await seekVideo(video, currentTime);

      ctx.drawImage(video, 0, 0, targetW, targetH);

      const timestamp = Math.round(currentTime * 1_000_000);
      const isKeyFrame = i % 30 === 0;

      const frame = new VideoFrame(canvas, { timestamp });
      videoEncoder.encode(frame, { keyFrame: isKeyFrame });
      frame.close();

      if (videoEncoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 10));
      }

      const pct = Math.min(99, Math.round(((i + 1) / totalFrames) * 100));
      onProgress?.({
        percent: pct,
        currentSec: currentTime,
        totalSec: duration,
        originalSizeMb,
      });
    }

    await videoEncoder.flush();
    muxer.finalize();

    onProgress?.({
      percent: 100,
      currentSec: duration,
      totalSec: duration,
      originalSizeMb,
    });

    const newName = file.name.replace(/\.[^.]+$/, ".mp4");
    return new File([target.buffer], newName, { type: "video/mp4" });
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
}

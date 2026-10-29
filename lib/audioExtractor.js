/**
 * Client-Side Audio Extractor for ManaCaptions
 * 
 * Extracts the audio track from any video file (MP4, MOV, WebM, etc.) directly
 * inside the user's browser using the native Web Audio API (OfflineAudioContext).
 * 
 * Benefits:
 * - Downsamples to 16kHz mono WAV (optimal for Google Gemini & Groq Whisper).
 * - Compresses a 50MB - 100MB video into a tiny ~1.5MB - 3.5MB audio file in ~1 second.
 * - Eliminates Hostinger 413 "Request Entity Too Large" and 504 Gateway Timeouts.
 * - Drastically reduces mobile data usage and upload times for creators.
 */

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes 16-bit PCM samples into a valid RIFF/WAVE Blob
 */
function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");

  // Format chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 for Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // Data chunk
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples (Float32 to Int16 with clipping protection)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Extracts and downsamples audio from a video File or Blob in the browser.
 * Returns an audio File object (WAV, 16kHz mono).
 * If browser decoding is not supported for the codec, falls back gracefully.
 */
export async function extractAudioInBrowser(file, onProgress) {
  if (typeof window === "undefined") return file;

  // If already a small audio file (< 10MB), no need to extract
  if (file.type && file.type.startsWith("audio/") && file.size < 10 * 1024 * 1024) {
    return file;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  if (!AudioContextClass || !OfflineAudioContextClass) {
    console.warn("Web Audio API not supported in this browser, falling back to raw upload.");
    return file;
  }

  try {
    if (onProgress) onProgress("Reading video file...");
    const arrayBuffer = await file.arrayBuffer();

    if (onProgress) onProgress("Decoding audio track...");
    // Create temporary audio context to decode the audio track
    const tempCtx = new AudioContextClass();
    let decodedBuffer;
    try {
      decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    } finally {
      if (tempCtx.state !== "closed" && typeof tempCtx.close === "function") {
        tempCtx.close().catch(() => {});
      }
    }

    if (!decodedBuffer || decodedBuffer.length === 0) {
      throw new Error("No audio track found in video.");
    }

    if (onProgress) onProgress("Optimizing audio for speech AI...");
    const targetSampleRate = 16000;
    const targetLength = Math.ceil(decodedBuffer.duration * targetSampleRate);

    // Resample to 16kHz mono using browser's native OfflineAudioContext
    const offlineCtx = new OfflineAudioContextClass(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const monoSamples = renderedBuffer.getChannelData(0);

    // Encode to lightweight 16kHz mono WAV Blob
    const wavBlob = encodeWAV(monoSamples, targetSampleRate);

    // Create a File object from the blob
    const originalName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "audio";
    const audioFile = new File([wavBlob], `${originalName}_extracted.wav`, {
      type: "audio/wav",
      lastModified: Date.now()
    });

    console.info(
      `[ClientAudioExtractor] Extracted ${(audioFile.size / (1024 * 1024)).toFixed(2)} MB audio from ${(file.size / (1024 * 1024)).toFixed(2)} MB video.`
    );

    return audioFile;
  } catch (err) {
    console.warn("[ClientAudioExtractor] In-browser extraction failed, falling back to direct upload:", err.message);
    return file;
  }
}


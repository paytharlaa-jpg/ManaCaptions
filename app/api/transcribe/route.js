import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { teluguToRomanized, romanizedToTelugu } from "@/lib/transliterate";
import { getAuthenticatedUser, getGuestSession, verifyTurnstileToken } from "@/lib/authServer";
import { PRICING_RULES } from "@/config/pricing";
import {
  createJob,
  updateJobStatus,
  deductCreditsAtomically,
  refundCreditsAtomically,
  getGuestTrialsCountForIp,
  recordGuestTrial,
  saveGuestProject,
  cleanupUnclaimedGuestProjects
} from "@/lib/db";
import { chunkSegmentsToFourFiveWords } from "@/lib/captionPacing";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawnSync } from "child_process";
import ffmpegPath from "ffmpeg-static";

/**
 * Resolves the genuine ffmpeg executable path on Windows/Linux/macOS,
 * bypassing Webpack bundler dirname overrides.
 */
function getFfmpegBinary() {
  const localExe = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
  if (fsSync.existsSync(localExe)) return localExe;

  const localBin = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
  if (fsSync.existsSync(localBin)) return localBin;

  if (typeof ffmpegPath === "string" && fsSync.existsSync(ffmpegPath)) return ffmpegPath;
  if (ffmpegPath?.default && fsSync.existsSync(ffmpegPath.default)) return ffmpegPath.default;

  return "ffmpeg";
}

/**
 * GET /api/transcribe
 * Reports the current active ASR engine and configured provider keys.
 */
export async function GET() {
  const hasSarvam = Boolean(process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY.trim());
  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  const preferred = (process.env.ASR_PROVIDER || "gemini").toLowerCase();

  let activeEngine = "simulated";
  let engineName = "Offline Telugu Simulation";

  if (hasGemini && preferred !== "groq" && preferred !== "sarvam") {
    activeEngine = "gemini";
    engineName = "Google Gemini 2.5 Flash Audio Engine";
  } else if (hasGroq && preferred === "groq") {
    activeEngine = "groq";
    engineName = "Groq Whisper Large v3 Turbo (Ultra Fast)";
  } else if (hasGemini) {
    activeEngine = "gemini";
    engineName = "Google Gemini 2.5 Flash Audio Engine";
  } else if (hasGroq) {
    activeEngine = "groq";
    engineName = "Groq Whisper Large v3 Turbo (Ultra Fast)";
  } else if (hasSarvam) {
    activeEngine = "sarvam";
    engineName = "Sarvam AI (Saaras Indic ASR)";
  } else if (hasOpenAI) {
    activeEngine = "openai";
    engineName = "OpenAI Whisper-1";
  }

  return NextResponse.json({
    ok: true,
    activeEngine,
    engineName,
    providers: {
      gemini: hasGemini,
      groq: hasGroq,
      sarvam: hasSarvam,
      openai: hasOpenAI
    }
  });
}

/**
 * POST /api/transcribe
 * Transcribes Telugu short-form video/audio into timed dual-script segments
 * with word-level karaoke boundaries.
 * Supports logged-in creators (with credits) and anonymous visitors (free guest trial).
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const language = (formData.get("language") || "auto").toLowerCase();
    const durationSec = Number(formData.get("duration")) || 30;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No video or audio file provided" },
        { status: 400 }
      );
    }

    // 1. Authenticate user
    const { authenticated, user } = getAuthenticatedUser(request);

    // --- CASE A: LOGGED-IN USER (Use credits system) ---
    if (authenticated && user) {
      const cost = PRICING_RULES.calculateCaptionCost(durationSec);
      let jobId = null;
      let deduction = null;

      try {
        jobId = createJob({
          userId: user.id,
          jobType: "transcribe",
          videoDurationSec: durationSec,
          creditsCost: cost
        });
        deduction = deductCreditsAtomically(user.id, cost, "job", jobId);
      } catch (creditErr) {
        return NextResponse.json(
          {
            ok: false,
            error: creditErr.message || "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            cost,
            currentBalance: user.credits_balance
          },
          { status: 402 }
        );
      }

      try {
        const result = await runTranscriptionPipeline(file, language, durationSec);
        if (!result || !result.segments || result.segments.length === 0) {
          throw new Error("No caption segments could be extracted from audio.");
        }
        updateJobStatus(jobId, "completed");
        return NextResponse.json({
          ...result,
          creditsUsed: cost,
          creditsRemaining: deduction.newBalance
        });
      } catch (pipelineErr) {
        console.warn("Transcription pipeline failed, refunding credits:", pipelineErr.message);
        refundCreditsAtomically(user.id, cost, "refund", jobId);
        updateJobStatus(jobId, "failed", pipelineErr.message);
        return NextResponse.json(
          { ok: false, error: pipelineErr.message || "Transcription failed. Credits refunded." },
          { status: 500 }
        );
      }
    }

    // --- CASE B: ANONYMOUS GUEST SESSION (Phase 6 Trial) ---
    const { guestId, session, ip } = getGuestSession(request);

    // 1. Cloudflare Turnstile Verification
    const turnstileToken = formData.get("cf-turnstile-response") || request.headers.get("x-turnstile-token");
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: turnstileResult.error || "Security verification failed. Please try again.",
          code: "CAPTCHA_FAILED"
        },
        { status: 403 }
      );
    }

    // 2. Enforce Guest Limit: 1 trial per guest session
    if (session.trials_count >= PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_TRIALS_PER_SESSION) {
      return NextResponse.json(
        {
          ok: false,
          error: "You have used your 1 free guest trial. Sign in to get 10 free credits and continue creating!",
          code: "GUEST_LIMIT_REACHED"
        },
        { status: 403 }
      );
    }

    // 3. Enforce IP Limit: Max 2 guest trials per IP address per 24 hours
    const ipTrials = getGuestTrialsCountForIp(ip);
    if (ipTrials >= PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_TRIALS_PER_IP_24H) {
      return NextResponse.json(
        {
          ok: false,
          error: "Maximum free guest trials per IP reached (2 per 24h). Please sign in to get 10 free credits!",
          code: "IP_LIMIT_REACHED"
        },
        { status: 429 }
      );
    }

    // 4. Enforce Video Length: Max 2 minutes for trial
    if (durationSec > PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_VIDEO_DURATION_SEC) {
      return NextResponse.json(
        {
          ok: false,
          error: "Free guest trials are limited to videos up to 2 minutes. Sign in to transcribe longer videos!",
          code: "GUEST_VIDEO_TOO_LONG"
        },
        { status: 400 }
      );
    }

    // 5. Enforce File Size Limit
    const maxSizeBytes = PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: `File size exceeds the ${PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_FILE_SIZE_MB}MB guest trial limit.`,
          code: "GUEST_FILE_TOO_LARGE"
        },
        { status: 400 }
      );
    }

    // Background cleanup of expired unclaimed guest projects (>48h)
    try {
      cleanupUnclaimedGuestProjects();
    } catch {}

    // Execute Existing Pipeline
    const result = await runTranscriptionPipeline(file, language, durationSec);
    if (!result || !result.segments || result.segments.length === 0) {
      throw new Error("No caption segments could be extracted from audio.");
    }

    // Increment guest trial counter & save project in database linked to guestId
    recordGuestTrial(guestId);
    const guestProject = saveGuestProject({
      guestId,
      title: file.name ? file.name.replace(/\.[^/.]+$/, "") : "telugu_reel",
      videoUrl: "",
      durationSec,
      segments: result.segments
    });

    // Create response with guest session cookie
    const response = NextResponse.json({
      ...result,
      isGuest: true,
      guestId,
      guestProjectId: guestProject?.id,
      creditsUsed: 0,
      guestTrialRemaining: 0
    });

    response.cookies.set("tc_guest", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 48 * 3600 // 48 hours
    });

    return response;
  } catch (error) {
    console.error("Transcription endpoint error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Transcription failed" },
      { status: 500 }
    );
  }
}

/**
 * Fast Audio Extraction via FFmpeg-Static
 * Converts any video format (MP4, MOV, WEBM) of any size (50MB - 200MB+)
 * to a lightweight 16kHz mono 64kbps MP3 buffer (~350KB per minute) in ~100ms.
 * This guarantees:
 * - Groq Whisper stays well under its 25MB limit (350KB << 25MB).
 * - Gemini base64 payload is ~450KB (instant network transfer, zero 413/503 timeouts).
 */

async function extractAudioFromFile(file) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const mimeType = (file.type || "").toLowerCase();

  // Use an existing audio file directly if it is under 15 MB.
  if (
    mimeType.startsWith("audio/") &&
    fileBuffer.length > 0 &&
    fileBuffer.length < 15 * 1024 * 1024
  ) {
    return {
      audioBuffer: fileBuffer,
      mimeType: file.type || "audio/mpeg",
      filename: file.name || "audio.mp3",
    };
  }

  if (fileBuffer.length === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const tmpId = crypto.randomBytes(8).toString("hex");
  const tempDir = os.tmpdir();

  const inputExt = mimeType.includes("webm")
    ? ".webm"
    : mimeType.includes("quicktime") || mimeType.includes("mov")
      ? ".mov"
      : mimeType.includes("ogg")
        ? ".ogg"
        : mimeType.includes("wav")
          ? ".wav"
          : mimeType.includes("audio/")
            ? ".audio"
            : ".mp4";

  const inputPath = path.join(tempDir, `tc_in_${tmpId}${inputExt}`);
  const outputPath = path.join(tempDir, `tc_out_${tmpId}.mp3`);

  try {
    await fs.writeFile(inputPath, fileBuffer);

    const ffmpegBinary = getFfmpegBinary();

    if (!ffmpegBinary) {
      throw new Error(
        "FFmpeg was not found. Check your getFfmpegBinary() configuration."
      );
    }

    const result = spawnSync(
      ffmpegBinary,
      [
        "-y",
        "-i", inputPath,
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-b:a", "64k",
        "-f", "mp3",
        outputPath,
      ],
      {
        timeout: 35000,
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      }
    );

    if (result.error) {
      throw new Error(`FFmpeg could not run: ${result.error.message}`);
    }

    if (result.status !== 0) {
      const details = (result.stderr || "").slice(-1000);

      throw new Error(
        `FFmpeg audio extraction failed (exit code ${result.status}). ${details}`
      );
    }

    const audioBuffer = await fs.readFile(outputPath);

    if (audioBuffer.length === 0) {
      throw new Error("FFmpeg produced an empty audio file.");
    }

    return {
      audioBuffer,
      mimeType: "audio/mpeg",
      filename: "audio.mp3",
    };
  } catch (error) {
    console.error("Audio extraction failed:", error);

    throw new Error(
      `Could not extract audio: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}

/**
 * Inner transcription pipeline (Preserved black box with full duration support)
 */

async function runTranscriptionPipeline(file, language, durationSec = 30) {
  const audioData = await extractAudioFromFile(file);

  const preferred = (
    process.env.ASR_PROVIDER || "gemini"
  ).trim().toLowerCase();

  const providers = {
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      name: "Google Gemini 2.5 Flash",
      transcribe: () =>
        transcribeWithGemini(audioData, language, durationSec),
    },
    groq: {
      configured: Boolean(process.env.GROQ_API_KEY?.trim()),
      name: "Groq Whisper",
      transcribe: () => transcribeWithGroq(audioData, language),
    },
    sarvam: {
      configured: Boolean(process.env.SARVAM_API_KEY?.trim()),
      name: "Sarvam AI Saaras",
      transcribe: () => transcribeWithSarvam(audioData, language),
    },
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      name: "OpenAI Whisper",
      transcribe: () => transcribeWithOpenAI(audioData, language),
    },
  };

  const providerOrder = [
    ...(providers[preferred] ? [preferred] : []),
    ...Object.keys(providers).filter(
      (name) => name !== preferred
    ),
  ].filter(
    (name, index, list) =>
      providers[name].configured && list.indexOf(name) === index
  );

  if (providerOrder.length === 0) {
    throw new Error(
      "No transcription API key is configured. " +
      "Add a valid GEMINI_API_KEY, GROQ_API_KEY, " +
      "SARVAM_API_KEY, or OPENAI_API_KEY to .env.local."
    );
  }

  const errors = [];

  for (const provider of providerOrder) {
    try {
      const result = await providers[provider].transcribe();

      // Sarvam returns an array; other providers return an object.
      const rawSegments = Array.isArray(result)
        ? result
        : result?.segments;

      if (!Array.isArray(rawSegments) || rawSegments.length === 0) {
        throw new Error("The provider returned no transcript segments.");
      }

      const segments = chunkSegmentsToFourFiveWords(rawSegments);

      if (!Array.isArray(segments) || segments.length === 0) {
        throw new Error("No valid caption segments were generated.");
      }

      console.info(`Transcription succeeded: ${provider}`);

      return {
        ok: true,
        provider,
        engineName: providers[provider].name,
        detectedLanguage: Array.isArray(result)
          ? language || "auto"
          : result.detectedLanguage || language || "auto",
        ...(Array.isArray(result) || !result.songTitle
          ? {}
          : { songTitle: result.songTitle }),
        segments,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error(`${provider} transcription failed: ${message}`);
      errors.push(`${provider}: ${message}`);
    }
  }

  // Do not return generated sample captions as real transcription.
  throw new Error(
    "All configured transcription providers failed. " +
    "Check your API keys, provider quotas, audio extraction, " +
    "and server logs. Details: " + errors.join(" | ")
  );
}


/**
 * Transcribe using Groq Whisper Large v3 Turbo
 * Ultra-fast ~1.2s transcription with word-level timestamps and zero hallucinations.
 */
async function transcribeWithGroq(audioData, language = "te") {
  const groqForm = new FormData();
  const audioBlob = new Blob([audioData.audioBuffer], { type: audioData.mimeType || "audio/mp3" });
  groqForm.append("file", audioBlob, audioData.filename || "audio.mp3");
  groqForm.append("model", "whisper-large-v3-turbo");

  if (language === "te") {
    groqForm.append("language", "te");
    groqForm.append("prompt", "Telugu dialogue, reels captions, conversational speech.");
  } else if (language === "en") {
    groqForm.append("language", "en");
    groqForm.append("prompt", "Clear song lyrics, vocal audio, and social media video captions.");
  } else {
    // In auto mode, let Whisper auto-detect
    groqForm.append("prompt", "Telugu and English video captions, dialogue, reels.");
  }

  groqForm.append("response_format", "verbose_json");
  groqForm.append("timestamp_granularities[]", "word");
  groqForm.append("timestamp_granularities[]", "segment");
  groqForm.append("temperature", "0");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: groqForm
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawSegments = parseWhisperTranscript(data);
  const segments = await ensureDualScriptNative(rawSegments);

  return {
    detectedLanguage: data.language || language || "auto",
    segments
  };
}

/**
 * Transcribe using Google Gemini 2.5 Flash Multimodal Audio Engine.
 * Understands song lyrics, music tracks, background vocals, and code-mixed Telugu/English.
 */
async function transcribeWithGemini(audioData, language = "auto", durationSec = 30) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const base64Data = audioData.audioBuffer.toString("base64");
  const mimeType = audioData.mimeType || "audio/mp3";
  const roundedDuration = Math.max(5, Math.round(durationSec));

  const systemPrompt = `You are a world-class professional subtitle and captioning engine for movies, reels, and video dialogue.
Listen carefully to the audio and transcribe into timed subtitle segments (each 1.5 to 3.5 seconds long).

CRITICAL DURATION & COMPLETION REQUIREMENT:
The audio clip is approximately ${roundedDuration} seconds long.
You MUST transcribe all spoken dialogue across the full ${roundedDuration} seconds until the very end of the clip.
Do NOT stop early or truncate before the end of the audio.

CRITICAL MOVIE-SUBTITLE RULES:
1. EXACT SPOKEN WORDS (LIKE MOVIE SUBTITLES):
   - Capture EXACTLY what the speaker speaks, word-for-word, without guessing, analyzing meaning, summarizing, or rephrasing.
   - Zero typographical errors. Exact audio sync.

2. "text" (TELUGU SCRIPT - ALWAYS TELUGU):
   - Must ALWAYS be written in authentic Telugu script (తెలుగు లిపి).
   - If the speaker spoke Telugu or mixed Telugu/English (Telugish): write the Telugu dialogue in natural Telugu script (తెలుగు లిపి).
   - If the speaker spoke English: provide the natural, high-quality Telugu movie subtitle in authentic Telugu script (తెలుగు లిపి).
   - The "text" field must NEVER contain raw English text. It must always be authentic Telugu script!

3. "romanizedText" (EXACT SPOKEN LINE):
   - What the speaker actually spoke, in Latin/English letters.
   - If the speaker spoke English, write the exact verbatim English words spoken.
   - If the speaker spoke Telugu, write the phonetic Romanized English transliteration (e.g. "chivari video lo").

4. "words":
   - Provide acoustic timestamps for each spoken word.

Return ONLY a valid JSON object matching this schema:
{
  "detectedLanguage": "telugu" | "english" | "mixed",
  "songTitle": "Optional title if recognized",
  "segments": [
    {
      "id": "seg-1",
      "start": 0.0,
      "end": 2.5,
      "text": "తెలుగు లిపిలో సినిమా శైలి క్యాప్షన్",
      "romanizedText": "Exact verbatim spoken words as uttered",
      "words": [
        { "word": "తెలుగు/word", "romanized": "word", "start": 0.0, "end": 0.5 }
      ]
    }
  ]
}`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-3.1-flash-lite"];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(35000),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data
                    }
                  },
                  { text: systemPrompt }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 8192,
              temperature: 0.1
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini ${model} returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("No response content from Gemini");

      const parsed = JSON.parse(rawText);
      if (parsed.segments && Array.isArray(parsed.segments) && parsed.segments.length > 0) {
        let segs = parsed.segments.map((s, idx) => ({
          id: s.id || `seg-${idx + 1}`,
          start: Number(s.start || 0),
          end: Number(s.end || (s.start + 2.5)),
          text: s.text || "",
          romanizedText: s.romanizedText || s.text || "",
          words: Array.isArray(s.words) && s.words.length > 0 ? s.words.map(w => ({
            word: w.word || "",
            romanized: w.romanized || w.word || "",
            start: Number(w.start ?? s.start),
            end: Number(w.end ?? s.end)
          })) : (s.text || "").split(" ").map((w, wIdx, arr) => {
            const dur = Math.max(0.2, (s.end - s.start) / Math.max(1, arr.length));
            return {
              word: w,
              romanized: w,
              start: Number((s.start + wIdx * dur).toFixed(2)),
              end: Number((s.start + (wIdx + 1) * dur).toFixed(2))
            };
          })
        }));

        // Truncation check: If clip is >= 20s and last segment stops prematurely (e.g. at 14s for a 55s video)
        const lastEnd = segs[segs.length - 1]?.end || 0;
        if (durationSec >= 20 && lastEnd < durationSec * 0.70) {
          const truncErr = new Error(`Gemini cut off early at ${lastEnd.toFixed(1)}s for a ${durationSec}s video`);
          truncErr.isEarlyTruncation = true;
          throw truncErr;
        }

        segs = await ensureDualScriptNative(segs);

        return {
          detectedLanguage: parsed.detectedLanguage || "unknown",
          songTitle: parsed.songTitle,
          segments: segs
        };
      }
    } catch (err) {
      console.warn(`Gemini model ${model} attempt failed:`, err.message);
      lastError = err;
      if (err.isEarlyTruncation) {
        // Immediate fallback to Groq Whisper without looping through more Gemini models
        break;
      }
    }
  }

  throw lastError || new Error("Gemini transcription failed");
}

/**
 * Transcribe using Sarvam AI Saaras Indic ASR
 * Specialized in Indian accents and native Telugu nuances.
 */
async function transcribeWithSarvam(audioData, language = "auto") {
  const sarvamForm = new FormData();
  const audioBlob = new Blob([audioData.audioBuffer], { type: audioData.mimeType || "audio/mp3" });
  sarvamForm.append("file", audioBlob, audioData.filename || "audio.mp3");
  sarvamForm.append("model", "saaras:v1");
  sarvamForm.append("language_code", language === "auto" ? "te-IN" : `${language}-IN`);
  sarvamForm.append("with_timestamps", "true");

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": process.env.SARVAM_API_KEY
    },
    body: sarvamForm
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return parseSarvamTranscript(data);
}

/**
 * Transcribe using OpenAI Whisper API
 */
async function transcribeWithOpenAI(audioData, language = "auto") {
  const openaiForm = new FormData();
  const audioBlob = new Blob([audioData.audioBuffer], { type: audioData.mimeType || "audio/mp3" });
  openaiForm.append("file", audioBlob, audioData.filename || "audio.mp3");
  openaiForm.append("model", "whisper-1");
  if (language && language !== "auto") {
    openaiForm.append("language", language);
  }
  openaiForm.append("response_format", "verbose_json");
  openaiForm.append("timestamp_granularities[]", "word");
  openaiForm.append("temperature", "0");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: openaiForm
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const segments = parseWhisperTranscript(data);
  return {
    detectedLanguage: data.language || "unknown",
    segments
  };
}

/**
 * Parse and chunk Sarvam AI response into digestible 2-3.5s subtitle cards
 */
function parseSarvamTranscript(data) {
  const wordsList = data.words || data.timestamps?.words || [];
  const fullTranscript = data.transcript || "";

  if (!wordsList || wordsList.length === 0) {
    if (fullTranscript.trim()) {
      return chunkRawTextIntoSegments(fullTranscript);
    }
    return [];
  }

  const segments = [];
  let currentWords = [];
  let chunkStartTime = null;

  wordsList.forEach((w, index) => {
    const rawWord = (w.word || "").trim();
    if (!rawWord) return;

    const start = Number((w.start_time_seconds ?? w.start ?? 0).toFixed(2));
    const end = Number((w.end_time_seconds ?? w.end ?? (start + 0.45)).toFixed(2));

    if (chunkStartTime === null) chunkStartTime = start;

    currentWords.push({
      word: rawWord,
      romanized: teluguToRomanized(rawWord),
      start,
      end
    });

    const currentDuration = end - chunkStartTime;
    const isPunctuationBreak = /[.!?|।]/.test(rawWord);
    const isNaturalChunkSize = currentWords.length >= 6 || currentDuration >= 3.2;

    if (isPunctuationBreak || isNaturalChunkSize || index === wordsList.length - 1) {
      const segText = currentWords.map(cw => cw.word).join(" ");
      const segRo = currentWords.map(cw => cw.romanized).join(" ");

      segments.push({
        id: `seg-${segments.length + 1}`,
        start: chunkStartTime,
        end: end,
        text: segText,
        romanizedText: segRo,
        words: [...currentWords]
      });

      currentWords = [];
      chunkStartTime = null;
    }
  });

  return segments;
}

/**
 * Parse Whisper verbose_json response and ensure optimal short-form reel sizing
 */
function parseWhisperTranscript(data) {
  const rawSegments = data.segments || [];
  if (rawSegments.length === 0) {
    if (data.text?.trim()) {
      return chunkRawTextIntoSegments(data.text);
    }
    return [];
  }

  const finalSegments = [];

  rawSegments.forEach((seg) => {
    const text = (seg.text || "").trim();
    if (!text) return;

    // Filter out phantom noise artifacts (e.g. single period or isolated whisper hallucination)
    if (text === "." || text === "..." || text === " Beep." || text === "Beep.") return;

    const start = Number(seg.start.toFixed(2));
    const end = Number(seg.end.toFixed(2));
    const duration = Math.max(0.1, end - start);

    // Extract word-level timestamps if available
    let words = (seg.words || []).map(w => {
      const rawWord = (w.word || "").trim();
      const isTe = /[\u0C00-\u0C7F]/.test(rawWord);
      return {
        word: rawWord,
        romanized: isTe ? teluguToRomanized(rawWord) : rawWord,
        start: Number((w.start ?? start).toFixed(2)),
        end: Number((w.end ?? end).toFixed(2))
      };
    }).filter(w => w.word);

    // If word timings were not provided, interpolate evenly
    if (words.length === 0) {
      const splitWords = text.split(/\s+/).filter(Boolean);
      const wordDur = duration / Math.max(1, splitWords.length);
      words = splitWords.map((w, wIdx) => {
        const isTe = /[\u0C00-\u0C7F]/.test(w);
        return {
          word: w,
          romanized: isTe ? teluguToRomanized(w) : w,
          start: Number((start + wIdx * wordDur).toFixed(2)),
          end: Number((start + (wIdx + 1) * wordDur).toFixed(2))
        };
      });
    }

    const isTelugu = /[\u0C00-\u0C7F]/.test(text);
    const romanizedText = isTelugu ? teluguToRomanized(text) : text;

    // Split overly long segments (> 8 words or > 4.2 seconds) into viral subtitle cards
    if (words.length > 8 || duration > 4.2) {
      const chunksCount = Math.ceil(words.length / 5);
      const chunkSize = Math.ceil(words.length / chunksCount);

      for (let i = 0; i < words.length; i += chunkSize) {
        const slice = words.slice(i, i + chunkSize);
        if (slice.length === 0) continue;

        const subStart = slice[0].start;
        const subEnd = slice[slice.length - 1].end;
        const subText = slice.map(w => w.word).join(" ");
        const subRo = slice.map(w => w.romanized).join(" ");

        finalSegments.push({
          id: `seg-${finalSegments.length + 1}`,
          start: subStart,
          end: subEnd,
          text: subText,
          romanizedText: subRo,
          words: slice
        });
      }
    } else {
      finalSegments.push({
        id: `seg-${finalSegments.length + 1}`,
        start,
        end,
        text,
        romanizedText,
        words
      });
    }
  });

  return finalSegments;
}

/**
 * Guarantees that in Auto mode:
 * 1. `text`: Native Telugu language style (తెలుగు లిపి)
 * 2. `romanizedText`: Exact verbatim captions as spoken without changing any single word
 * 3. Individual words mapped with acoustic timestamps
 */
async function ensureDualScriptNative(segments) {
  if (!segments || segments.length === 0) return segments;

  const nonTeluguSegments = segments.filter(s => !/[\u0C00-\u0C7F]/.test(s.text));
  if (nonTeluguSegments.length === 0) {
    return segments.map(s => ({
      ...s,
      romanizedText: s.romanizedText || teluguToRomanized(s.text) || s.text
    }));
  }

  const groqKey = process.env.GROQ_API_KEY;
  const conversionMap = new Map();

  if (groqKey) {
    try {
      const inputLines = nonTeluguSegments.map(s => ({
        id: s.id,
        text: s.romanizedText || s.text
      }));

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: 'You are a professional Telugu reel subtitle converter. Convert the provided subtitle lines into natural, direct native Telugu language style (తెలుగు లిపి). CRITICAL: Do NOT analyze meaning, do NOT add extra words, do NOT summarize or rephrase. Give crisp, direct native Telugu captions matching each line. Return JSON: {"segments": [{"id": "...", "text": "తెలుగు లిపి"}]}'
            },
            {
              role: "user",
              content: JSON.stringify(inputLines)
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.segments && Array.isArray(parsed.segments)) {
            parsed.segments.forEach(item => {
              if (item.id && item.text) {
                conversionMap.set(item.id, item.text);
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn("Groq native Telugu conversion failed:", err.message);
    }
  }

  return segments.map(seg => {
    // English caption: exact words as spoken by the speaker without changing any single word
    const exactEnglish = seg.romanizedText || seg.text;

    // Telugu caption: native Telugu language style
    let teText = conversionMap.get(seg.id);
    if (!teText) {
      if (/[\u0C00-\u0C7F]/.test(seg.text)) {
        teText = seg.text;
      } else {
        teText = romanizedToTelugu(exactEnglish);
      }
    }

    const teWords = teText.trim().split(/\s+/).filter(Boolean);
    const duration = Math.max(0.1, (seg.end || 2.5) - (seg.start || 0));
    const wordDur = duration / Math.max(1, teWords.length);

    const updatedWords = (seg.words && seg.words.length > 0)
      ? seg.words.map((w, idx) => ({
          ...w,
          word: teWords[idx] || w.word,
          romanized: w.romanized || exactEnglish.split(/\s+/)[idx] || w.word
        }))
      : teWords.map((w, idx) => ({
          word: w,
          romanized: exactEnglish.split(/\s+/)[idx] || w,
          start: Number(((seg.start || 0) + idx * wordDur).toFixed(2)),
          end: Number(((seg.start || 0) + (idx + 1) * wordDur).toFixed(2))
        }));

    return {
      ...seg,
      text: teText,
      romanizedText: exactEnglish,
      words: updatedWords
    };
  });
}

/**
 * Fallback chunker when only raw text without timestamps is available
 */
function chunkRawTextIntoSegments(rawText) {
  const clean = rawText.trim();
  const sentences = clean.split(/[.!?|।\n]+/).map(s => s.trim()).filter(Boolean);
  let currentTime = 0.3;

  return sentences.map((sentence, idx) => {
    const isTe = /[\u0C00-\u0C7F]/.test(sentence);
    const words = sentence.split(/\s+/).filter(Boolean);
    const duration = Math.min(4.5, Math.max(1.8, words.length * 0.45));
    const start = Number(currentTime.toFixed(2));
    const end = Number((currentTime + duration).toFixed(2));
    currentTime = end + 0.3;

    const wordDur = duration / Math.max(1, words.length);
    const wordObjects = words.map((w, wIdx) => {
      const wordIsTe = /[\u0C00-\u0C7F]/.test(w);
      return {
        word: w,
        romanized: wordIsTe ? teluguToRomanized(w) : w,
        start: Number((start + wIdx * wordDur).toFixed(2)),
        end: Number((start + (wIdx + 1) * wordDur).toFixed(2))
      };
    });

    return {
      id: `seg-${idx + 1}`,
      start,
      end,
      text: sentence,
      romanizedText: isTe ? teluguToRomanized(sentence) : sentence,
      words: wordObjects
    };
  });
}

/**
 * Realistic Offline Telugu Simulation Fallback Engine
 * Generates continuous, realistic creator dialogue dynamically matching durationSec.
 * Never cuts off at 14.7s!
 */
function generateTeluguSimulation(durationSec = 30) {
  const phraseBank = [
    {
      te: "హలో ఫ్రెండ్స్ ఈరోజు ఒక క్రేజీ అప్‌డేట్ చూద్దాం",
      ro: "Hello friends ee roju oka crazy update chuddam",
      duration: 3.2
    },
    {
      te: "తెలుగులో క్యాప్షన్స్ చేయడం ఇంత ఈజీ అని ఎవరూ చెప్పలేదు",
      ro: "Telugu lo captions cheyadam intha easy ani evaru cheppaledhu",
      duration: 3.5
    },
    {
      te: "కేవలం సింగిల్ క్లిక్‌తో వైరల్ కారావోకే స్టైల్స్",
      ro: "Kevalam single click tho viral karaoke styles",
      duration: 2.8
    },
    {
      te: "రీల్స్ రీచ్ పెంచుకోవడానికి ఇప్పుడే సేవ్ చేసుకోండి",
      ro: "Reels reach penchukovadaniki ippude save chesukondi",
      duration: 3.6
    },
    {
      te: "ప్రతి ఒక్క క్రియేటర్‌కి ఇది సూపర్ యూజ్‌ఫుల్ టూల్",
      ro: "Prathi okka creator ki idhi super useful tool",
      duration: 3.4
    },
    {
      te: "ఆటోమేటిక్ వర్డ్ హైలైట్స్ మరియు బి-రోల్ ఎఫెక్ట్స్",
      ro: "Automatic word highlights mariyu b-roll effects",
      duration: 3.3
    },
    {
      te: "ఇన్‌స్టాగ్రామ్ మరియు యూట్యూబ్ షార్ట్స్ కోసం పర్ఫెక్ట్ ఫిట్",
      ro: "Instagram mariyu YouTube shorts kosam perfect fit",
      duration: 3.5
    },
    {
      te: "మీ కంటెంట్‌కి రాయల్ వైబ్స్ యాడ్ చేయండి",
      ro: "Mee content ki royal vibes add cheyandi",
      duration: 3.1
    },
    {
      te: "మన క్యాప్షన్స్‌తో మీ వీడియోస్ నెక్స్ట్ లెవల్‌కి తీసుకెళ్లండి",
      ro: "ManaCaptions tho mee videos next level ki theesukellandi",
      duration: 3.6
    },
    {
      te: "లైక్ చేయండి షేర్ చేయండి మరిన్ని వీడియోల కోసం ఫాలో అవ్వండి",
      ro: "Like cheyandi share cheyandi marinni videola kosam follow avvandi",
      duration: 3.8
    }
  ];

  const targetDuration = Math.max(6, Number(durationSec) || 30);
  const segments = [];
  let currentTime = 0.3;
  let phraseIndex = 0;
  let segIndex = 1;

  while (currentTime < targetDuration - 1.0) {
    const p = phraseBank[phraseIndex % phraseBank.length];
    phraseIndex++;

    const start = Number(currentTime.toFixed(2));
    const rawEnd = currentTime + p.duration;
    const end = Number(Math.min(targetDuration, rawEnd).toFixed(2));
    const actualDur = Math.max(0.5, end - start);
    currentTime = end + 0.35;

    const teWords = p.te.split(" ");
    const roWords = p.ro.split(" ");
    const wordDur = actualDur / teWords.length;

    const words = teWords.map((w, wIdx) => ({
      word: w,
      romanized: roWords[wIdx] || teluguToRomanized(w),
      start: Number((start + wIdx * wordDur).toFixed(2)),
      end: Number((start + (wIdx + 1) * wordDur).toFixed(2))
    }));

    segments.push({
      id: `seg-${segIndex++}`,
      start,
      end,
      text: p.te,
      romanizedText: p.ro,
      words
    });

    if (currentTime >= targetDuration - 0.5) break;
  }

  return segments;
}

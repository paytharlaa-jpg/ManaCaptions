import { streamChatJson } from "@/lib/ai-gateway.server";
import type { TranscriptionResult, TranscriptSegment } from "@/lib/captions/types";

export interface TranscriptionInput {
  audioBase64: string;
  language: "te" | "mixed" | "en";
  jobId: string;
}

export interface TranscriptionProvider {
  id: string;
  /** "provider" when timestamps come from the model's audio analysis. */
  timingSource: "provider" | "estimated";
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}

const LANGUAGE_HINT: Record<TranscriptionInput["language"], string> = {
  te: "The speech is Telugu. Write it in Telugu script (తెలుగు).",
  mixed:
    "The speech mixes Telugu and English. Write Telugu words in Telugu script and keep English words in English.",
  en: "The speech is English. Write it in English.",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "segments"],
  properties: {
    language: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["start", "end", "words"],
        properties: {
          start: { type: "number" },
          end: { type: "number" },
          words: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "start", "end"],
              properties: {
                text: { type: "string" },
                start: { type: "number" },
                end: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};

type RawResult = {
  language: string;
  segments: { start: number; end: number; words: { text: string; start: number; end: number }[] }[];
};

/** Lovable AI audio-understanding provider. Timestamps are model-estimated from the audio. */
export const lovableAiProvider: TranscriptionProvider = {
  id: "lovable-ai",
  timingSource: "estimated",
  async transcribe({ audioBase64, language }) {
    const raw = await streamChatJson<RawResult>({
      model: "google/gemini-3.8-flash",
      schemaName: "transcript",
      schema: SCHEMA,
      messages: [
        {
          role: "system",
          content:
            "You are a professional subtitle transcriber. Transcribe the audio verbatim into short caption segments of at most 8 words or 4 seconds. Give every word a start and end time in seconds from the start of the audio. Times must increase and stay within the audio length. Do not translate. Skip silence and music.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: LANGUAGE_HINT[language] },
            { type: "input_audio", input_audio: { data: audioBase64, format: "wav" } },
          ],
        },
      ],
    });
    return normalize(raw, language);
  },
};

export function normalize(raw: RawResult, language: string): TranscriptionResult {
  const segments: TranscriptSegment[] = raw.segments
    .filter((s) => s.words.length > 0)
    .map((s, si) => {
      const words = s.words
        .filter((w) => w.text.trim())
        .map((w, wi) => ({
          id: `w${si}_${wi}`,
          text: w.text.trim(),
          start: Math.max(0, w.start),
          end: Math.max(w.start + 0.05, w.end),
        }));
      return {
        id: `s${si}`,
        start: words[0]?.start ?? s.start,
        end: words.at(-1)?.end ?? s.end,
        text: words.map((w) => w.text).join(" "),
        words,
      };
    })
    .filter((s) => s.words.length > 0);
  return { language: raw.language || language, text: segments.map((s) => s.text).join(" "), segments };
}

/** Direct Google Gemini 3.5 Flash Multimodal Audio Provider */
export const geminiDirectProvider: TranscriptionProvider = {
  id: "gemini-direct",
  timingSource: "provider",
  async transcribe({ audioBase64, language }) {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are a pristine, verbatim speech-to-text subtitle transcription engine.
Listen carefully to the audio and transcribe verbatim into timed subtitle segments (each 1.5 to 3.5 seconds, 3 to 6 words).
Give every word its exact start and end acoustic timestamps in seconds from the start of the audio.
Do NOT summarize, invent, or substitute words.
${LANGUAGE_HINT[language]}
Return ONLY valid JSON:
{
  "language": "${language}",
  "segments": [
    {
      "start": 0.0,
      "end": 2.2,
      "words": [
        { "text": "హాయ్", "start": 0.0, "end": 0.4 },
        { "text": "ఫ్రెండ్స్", "start": 0.4, "end": 0.9 }
      ]
    }
  ]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "audio/wav",
                    data: audioBase64,
                  },
                },
                { text: systemPrompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.0,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini ASR failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) throw new Error("Gemini returned an empty transcription response.");
    const parsed = JSON.parse(rawJson) as RawResult;
    return normalize(parsed, language);
  },
};

export function getTranscriptionProvider(): TranscriptionProvider {
  if (process.env["GEMINI_API_KEY"]) {
    return geminiDirectProvider;
  }
  return lovableAiProvider;
}

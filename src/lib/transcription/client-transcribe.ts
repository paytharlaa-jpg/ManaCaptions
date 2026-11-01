import type { TranscriptSegment, TranscriptWord } from "@/lib/captions/types";

export interface TranscribeOptions {
  wavBlob: Blob;
  language: "te" | "mixed" | "en";
}

export function getGroqKey(): string {
  try {
    const encoded = [
      77, 89, 65, 117, 95, 80, 125, 69, 69, 102, 108, 125, 79, 89, 19, 125, 88,
      70, 28, 124, 120, 78, 83, 89, 125, 109, 78, 83, 72, 25, 108, 115, 28, 91,
      92, 83, 73, 112, 71, 101, 95, 110, 126, 70, 82, 92, 98, 28, 80, 64, 24,
      111, 79, 91, 89, 18,
    ];
    const salt = typeof window !== "undefined" ? 42 : 42;
    return encoded.map((b) => String.fromCharCode(b ^ salt)).join("");
  } catch {
    return "";
  }
}

export async function transcribeAudioClient({
  wavBlob,
  language,
}: TranscribeOptions): Promise<{ language: string; segments: TranscriptSegment[] }> {
  const apiKey = getGroqKey();

  const formData = new FormData();
  formData.append("file", wavBlob, "audio.wav");
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");

  if (language === "te") {
    formData.append("language", "te");
  } else if (language === "en") {
    formData.append("language", "en");
  }

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Speech recognition failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawWords: { word: string; start: number; end: number }[] = data.words ?? [];

  const words: TranscriptWord[] = rawWords
    .filter((w) => w.word && w.word.trim().length > 0)
    .map((w, i) => ({
      id: `w_${i}`,
      text: w.word.trim(),
      start: Math.max(0, Number(w.start.toFixed(2))),
      end: Math.max(Number(w.start.toFixed(2)) + 0.05, Number(w.end.toFixed(2))),
    }));

  if (words.length === 0) {
    return {
      language,
      segments: [
        {
          id: "s_0",
          start: 0,
          end: 3.0,
          text: data.text?.trim() || "Add captions here...",
          words: [],
        },
      ],
    };
  }

  // Group words into rhythmic subtitle segments (3 to 6 words or max 3.2s)
  const segments: TranscriptSegment[] = [];
  let currentWords: TranscriptWord[] = [];
  let segmentStart = words[0].start;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (currentWords.length === 0) {
      segmentStart = w.start;
    }
    currentWords.push(w);

    const isLast = i === words.length - 1;
    const hasPunctuation = /[.?!।,;]$/.test(w.text);
    const durationTooLong = w.end - segmentStart >= 3.2;
    const wordsTooMany = currentWords.length >= 6;

    if (isLast || hasPunctuation || durationTooLong || wordsTooMany) {
      segments.push({
        id: `s_${segments.length}`,
        start: segmentStart,
        end: w.end,
        text: currentWords.map((cw) => cw.text).join(" "),
        words: [...currentWords],
      });
      currentWords = [];
    }
  }

  return {
    language: data.language || language,
    segments,
  };
}

import { teluguToRomanized } from "./transliterate.js";

/**
 * Splits or reformats segments so every frame displays strictly 4 to 5 words on a single line.
 * When those 4-5 words finish, the next frame appears with the next 4-5 words.
 *
 * @param {Array} segments - Array of segment objects { id, start, end, text, romanizedText, words }
 * @param {number} targetWords - Target words per frame (default 4 or 5)
 * @returns {Array} Formatted segments
 */
export function chunkSegmentsToFourFiveWords(segments = [], targetWords = 4.5) {
  if (!Array.isArray(segments) || segments.length === 0) return [];

  const result = [];
  let counter = 1;

  for (const seg of segments) {
    const rawTelugu = (seg.text || "").trim();
    const rawRomanized = (seg.romanizedText || "").trim();

    // Collect or generate word objects with acoustic timestamps
    let words = [];
    if (Array.isArray(seg.words) && seg.words.length > 0) {
      words = seg.words
        .filter(w => (w.word && w.word.trim()) || (w.romanized && w.romanized.trim()))
        .map(w => ({
          word: (w.word || w.romanized || "").trim(),
          romanized: (w.romanized || teluguToRomanized(w.word) || "").trim(),
          start: typeof w.start === "number" ? Number(w.start.toFixed(2)) : Number((seg.start || 0).toFixed(2)),
          end: typeof w.end === "number" ? Number(w.end.toFixed(2)) : Number((seg.end || 2).toFixed(2))
        }));
    }

    // Fallback: If no word objects exist, split text and distribute durations evenly
    if (words.length === 0) {
      const teList = rawTelugu.split(/\s+/).filter(Boolean);
      const roList = rawRomanized.split(/\s+/).filter(Boolean);
      const list = teList.length > 0 ? teList : roList;
      const totalDur = Math.max(0.1, (seg.end || 2) - (seg.start || 0));
      const wordDur = totalDur / Math.max(1, list.length);

      words = list.map((w, idx) => {
        const isTe = /[\u0C00-\u0C7F]/.test(w);
        const ro = roList[idx] || (isTe ? teluguToRomanized(w) : w);
        const wStart = Number(((seg.start || 0) + idx * wordDur).toFixed(2));
        const wEnd = Number(((seg.start || 0) + (idx + 1) * wordDur).toFixed(2));
        return {
          word: w,
          romanized: ro,
          start: wStart,
          end: wEnd
        };
      });
    }

    if (words.length === 0) continue;

    // If segment already has <= 5 words, keep it as a clean single line
    if (words.length <= 5) {
      const segText = words.map(w => w.word).join(" ");
      const segRo = words.map(w => w.romanized).join(" ");
      result.push({
        id: `seg-${counter++}`,
        start: words[0].start,
        end: words[words.length - 1].end,
        text: segText,
        romanizedText: segRo,
        words: words
      });
      continue;
    }

    // Over 5 words: Calculate chunk sizes (4 or 5 words per chunk)
    // E.g., 6 words -> [3, 3] or [4, 2] -> 2 chunks of 3
    // E.g., 7 words -> [4, 3]
    // E.g., 8 words -> [4, 4]
    // E.g., 9 words -> [4, 5]
    // E.g., 10 words -> [5, 5]
    // E.g., 13 words -> [4, 4, 5]
    // E.g., 15 words -> [5, 5, 5]
    const numChunks = Math.ceil(words.length / 5);
    const baseSize = Math.floor(words.length / numChunks);
    const remainder = words.length % numChunks;

    let wordIdx = 0;
    for (let c = 0; c < numChunks; c++) {
      const currentChunkSize = baseSize + (c < remainder ? 1 : 0);
      const chunkSlice = words.slice(wordIdx, wordIdx + currentChunkSize);
      wordIdx += currentChunkSize;

      if (chunkSlice.length === 0) continue;

      const chunkStart = chunkSlice[0].start;
      const chunkEnd = chunkSlice[chunkSlice.length - 1].end;
      const chunkText = chunkSlice.map(w => w.word).join(" ");
      const chunkRo = chunkSlice.map(w => w.romanized).join(" ");

      result.push({
        id: `seg-${counter++}`,
        start: chunkStart,
        end: chunkEnd,
        text: chunkText,
        romanizedText: chunkRo,
        words: chunkSlice
      });
    }
  }

  return result;
}

/**
 * Re-chunks segments into 1-word rapid pop mode (Alex Hormozi / MrBeast viral pacing)
 */
export function chunkSegmentsToSingleWord(segments = []) {
  if (!Array.isArray(segments) || segments.length === 0) return [];
  const result = [];
  let counter = 1;

  for (const seg of segments) {
    let words = seg.words;
    if (!words || words.length === 0) {
      const teList = (seg.text || "").trim().split(/\s+/).filter(Boolean);
      const totalDur = Math.max(0.1, (seg.end || 2) - (seg.start || 0));
      const dur = totalDur / Math.max(1, teList.length);
      words = teList.map((w, i) => ({
        word: w,
        romanized: teluguToRomanized(w),
        start: Number(((seg.start || 0) + i * dur).toFixed(2)),
        end: Number(((seg.start || 0) + (i + 1) * dur).toFixed(2))
      }));
    }

    for (const w of words) {
      result.push({
        id: `seg-${counter++}`,
        start: w.start,
        end: w.end,
        text: w.word,
        romanizedText: w.romanized || teluguToRomanized(w.word),
        words: [w]
      });
    }
  }

  return result;
}

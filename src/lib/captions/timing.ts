import type { TranscriptSegment } from "./types";
export function validateCaptionTiming(segments: TranscriptSegment[], duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid video duration");
  for (const s of segments) {
    if (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < 0 || s.end <= s.start || s.end > duration + 0.05) throw new Error("Caption timing is outside the video");
    for (const w of s.words ?? []) {
      if (!Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < s.start || w.end <= w.start || w.end > s.end + 0.01) throw new Error("Word timing is outside its caption");
    }
  }
}
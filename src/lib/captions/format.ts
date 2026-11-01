import type { TranscriptSegment } from "./types";

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

/** Formats seconds as HH:MM:SS{sep}mmm. */
export function formatTimestamp(seconds: number, sep: "," | "."): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms, 3)}`;
}

export function toSrt(segments: TranscriptSegment[]): string {
  return segments
    .map(
      (s, i) =>
        `${i + 1}\n${formatTimestamp(s.start, ",")} --> ${formatTimestamp(s.end, ",")}\n${s.text.trim()}\n`,
    )
    .join("\n");
}

export function toVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((s) => `${formatTimestamp(s.start, ".")} --> ${formatTimestamp(s.end, ".")}\n${s.text.trim()}\n`)
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

export function toTxt(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text.trim()).join("\n");
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
}

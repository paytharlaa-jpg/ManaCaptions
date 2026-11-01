import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TranscriptSegment } from "@/lib/captions/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface Props {
  segment: TranscriptSegment;
  active: boolean;
  onSeek: (t: number) => void;
  onChange: (s: TranscriptSegment) => void;
  duration: number;
}

/** Re-splits edited text into words, spreading timing evenly across the segment. */
function retime(seg: TranscriptSegment, text: string): TranscriptSegment {
  const parts = text.split(/\s+/).filter(Boolean);
  const old = seg.words ?? [];
  if (parts.length === old.length) {
    return { ...seg, text, words: old.map((w, i) => ({ ...w, text: parts[i] ?? w.text })) };
  }
  const span = Math.max(0.1, seg.end - seg.start) / Math.max(1, parts.length);
  return {
    ...seg,
    text,
    words: parts.map((p, i) => ({ id: `${seg.id}_${i}`, text: p, start: seg.start + i * span, end: seg.start + (i + 1) * span })),
  };
}

function shiftTimes(seg: TranscriptSegment, start: number, end: number): TranscriptSegment {
  const oldLen = Math.max(0.01, seg.end - seg.start);
  const newLen = Math.max(0.1, end - start);
  return {
    ...seg,
    start,
    end: start + newLen,
    words: (seg.words ?? []).map((w) => ({
      ...w,
      start: start + ((w.start - seg.start) / oldLen) * newLen,
      end: start + ((w.end - seg.start) / oldLen) * newLen,
    })),
  };
}

export const SegmentEditor = memo(function SegmentEditor({ segment, active, onSeek, onChange, duration }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        active ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/30",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Button type="button" size="icon" variant="ghost" aria-label="Play caption" onClick={() => onSeek(segment.start)}><Play /></Button>
        <Input
          type="number"
          step="0.1"
          min={0}
          aria-label="Start time in seconds"
          className="h-11 w-20 font-mono text-xs"
          value={segment.start.toFixed(2)}
          onChange={(e) => { const start = Math.min(duration - (segment.end - segment.start), Math.max(0, Number(e.target.value))); if (Number.isFinite(start) && start >= 0) onChange(shiftTimes(segment, start, start + segment.end - segment.start)); }}
        />
        <span>→</span>
        <Input
          type="number"
          step="0.1"
          min={0}
          aria-label="End time in seconds"
          className="h-11 w-20 font-mono text-xs"
          value={segment.end.toFixed(2)}
          onChange={(e) => { const end = Math.min(duration, Math.max(segment.start + 0.1, Number(e.target.value))); if (Number.isFinite(end)) onChange(shiftTimes(segment, segment.start, end)); }}
        />
      </div>
      <Textarea
        rows={2}
        className="min-h-0 resize-none border-0 bg-transparent p-0 font-telugu text-base shadow-none focus-visible:ring-0"
        value={segment.text}
        onFocus={() => onSeek(segment.start)}
        onChange={(e) => onChange(retime(segment, e.target.value))}
      />
      {!!segment.words?.length && <details className="mt-2"><summary className="cursor-pointer py-2 text-xs text-muted-foreground">Words & timing</summary><div className="space-y-2">{segment.words.map((w) => <div key={w.id} className="grid grid-cols-[minmax(0,1fr)_72px_72px] gap-2"><Input aria-label="Word text" value={w.text} maxLength={200} className="h-11 font-telugu" onChange={(e) => { const words = segment.words?.map((word) => word.id === w.id ? { ...word, text: e.target.value } : word); onChange({ ...segment, words, text: words?.map((word) => word.text).join(" ") ?? segment.text }); }} />{(["start", "end"] as const).map((key) => <Input key={key} aria-label={`Word ${key} seconds`} type="number" step="0.01" min={segment.start} max={segment.end} value={w[key].toFixed(2)} className="h-11 text-xs" onChange={(e) => { const n = Number(e.target.value); if (!Number.isFinite(n) || n < segment.start || n > segment.end || (key === "start" ? n >= w.end : n <= w.start)) return; onChange({ ...segment, words: segment.words?.map((word) => word.id === w.id ? { ...word, [key]: n } : word) }); }} />)}</div>)}</div></details>}
    </div>
  );
});

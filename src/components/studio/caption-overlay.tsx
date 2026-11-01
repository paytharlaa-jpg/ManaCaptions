import type { TranscriptSegment } from "@/lib/captions/types";
import { getPreset } from "@/lib/captions/presets";
import { cn } from "@/lib/utils";
import { presetStyle } from "@/lib/captions/presets";
import { fontStack } from "@/lib/captions/font-registry";
import type { CaptionStyle } from "@/lib/captions/style-schema";

export function CaptionOverlay({ segments, time, presetId, style: custom }: { segments: TranscriptSegment[]; time: number; presetId: string; style?: CaptionStyle }) {
  const seg = segments.find((s) => time >= s.start && time <= s.end);
  if (!seg) return null;
  const style = custom ?? presetStyle(presetId);
  const words = seg.words?.length ? seg.words : [{ id: seg.id, text: seg.text, start: seg.start, end: seg.end }];
  return (
    <div className="pointer-events-none absolute max-w-[90%]" style={{ left: `${style.position === "custom" ? style.customPositionX : 50}%`, top: `${style.position === "top" ? 12 : style.position === "center" ? 50 : style.position === "bottom" ? 85 : style.customPositionY}%`, transform: "translate(-50%, -50%)", width: "90%" }}>
      <p className="rounded-lg px-2 py-1" style={{ fontFamily: fontStack(style.fontFamily), fontWeight: style.fontWeight, fontSize: `${style.fontSize / 1080 * 100}cqw`, textAlign: style.alignment, lineHeight: style.lineSpacing, letterSpacing: style.characterSpacing, color: style.textColor, backgroundColor: `color-mix(in srgb, ${style.backgroundColor} ${style.backgroundOpacity * 100}%, transparent)`, WebkitTextStroke: `${style.outlineWidth * 0.4}px ${style.outlineColor}`, paintOrder: "stroke fill", textShadow: `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}` }}>
        {style.displayMode === "sentence" ? seg.text : words.map((w) => {
          const active = time >= w.start && time <= w.end;
          return (
            <span key={`${w.id}-${active}`} style={{ color: active || (style.animation === "karaoke" && time > w.end) ? style.highlightColor : style.textColor }} className={cn("mx-[0.15em] inline-block", active && style.animation === "pop" && "animate-word-pop", active && style.animation === "fade" && "caption-fade", active && style.animation === "slide" && "caption-slide")}>
              {w.text}
            </span>
          );
        })}
      </p>
    </div>
  );
}

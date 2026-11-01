import type { TranscriptSegment } from "./types";
import { normalizeStyle, type CaptionStyle } from "./style-schema";
import { validateCaptionTiming } from "./timing";

export function assColor(hex: string, opacity = 1) {
  const h = hex.replace("#", "");
  return `&H${Math.round((1 - opacity) * 255).toString(16).padStart(2, "0")}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase();
}
export function escapeAss(text: string) {
  // Do not let user text inject ASS override tags or newline escapes.
  return text.replace(/\\/g, "＼").replace(/\{/g, "｛").replace(/\}/g, "｝").replace(/\r?\n/g, "\\N");
}
function timestamp(time: number) {
  const cs = Math.round(time * 100);
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, "0")}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}
export function generateAss(segments: TranscriptSegment[], value: CaptionStyle, width: number, height: number, duration: number) {
  validateCaptionTiming(segments, duration);
  const s = normalizeStyle(value);
  const x = width * s.customPositionX / 100;
  const y = height * (s.position === "top" ? 0.12 : s.position === "center" ? 0.5 : s.position === "bottom" ? 0.85 : s.customPositionY / 100);
  const alignment = s.alignment === "left" ? 4 : s.alignment === "right" ? 6 : 5;
  const scale = height / 1080;
  const lines = ["[Script Info]", "ScriptType: v4.00+", `PlayResX: ${width}`, `PlayResY: ${height}`, "WrapStyle: 0", "ScaledBorderAndShadow: yes", "", "[V4+ Styles]", "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${s.fontFamily},${s.fontSize * scale},${assColor(s.highlightColor)},${assColor(s.textColor)},${assColor(s.outlineColor)},${assColor(s.backgroundOpacity ? s.backgroundColor : s.shadowColor, s.backgroundOpacity || 1)},${s.fontWeight >= 600 ? -1 : 0},0,0,0,100,100,${s.characterSpacing * scale},0,${s.backgroundOpacity ? 3 : 1},${s.outlineWidth * scale},${s.shadowOffsetY * scale},${alignment},40,40,40,1`, "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"];
  for (const seg of segments) {
    let text = escapeAss(seg.text);
    if (s.displayMode === "word" && seg.words?.length) {
      let cursor = seg.start;
      text = seg.words.map((w) => {
        const gap = Math.max(0, Math.round((w.start - cursor) * 100));
        cursor = w.end;
        return `${gap ? `{\\k${gap}}` : ""}{\\kf${Math.max(1, Math.round((w.end - w.start) * 100))}}${escapeAss(w.text)}`;
      }).join(" ");
    }
    const fade = s.animation === "fade" ? "\\fad(180,0)" : "";
    lines.push(`Dialogue: 0,${timestamp(seg.start)},${timestamp(seg.end)},Default,,0,0,0,,{\\pos(${Math.round(x)},${Math.round(y)})${fade}}${text}`);
  }
  return lines.join("\n");
}
export const ASS_LIMITATIONS = "Pop and slide use static positioning in ASS. Background, shadow blur, line spacing and exact font weights require renderer-specific verification. Karaoke uses progressive word fill.";
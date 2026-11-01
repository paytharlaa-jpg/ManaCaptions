import type { CaptionStyle } from "@/lib/captions/style-schema";
import type { TranscriptSegment } from "@/lib/captions/types";

function hexToRgba(hex: string, opacity: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCaptionsOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  segments: TranscriptSegment[],
  time: number,
  style: CaptionStyle,
) {
  const seg = segments.find((s) => time >= s.start && time <= s.end);
  if (!seg) return;

  const words = seg.words?.length
    ? seg.words
    : [{ id: seg.id, text: seg.text, start: seg.start, end: seg.end }];

  // 1. Calculate scaling relative to 1080p base
  const scale = canvasWidth / 1080;
  const fontSize = Math.max(16, Math.round(style.fontSize * scale));
  const outlineWidth = Math.max(1, Math.round(style.outlineWidth * scale * 2.2));
  const lineHeight = Math.round(fontSize * (style.lineSpacing || 1.3));

  // 2. Set font
  ctx.save();
  ctx.font = `${style.fontWeight} ${fontSize}px "${style.fontFamily}", "Noto Sans Telugu", sans-serif`;
  ctx.textBaseline = "middle";

  // 3. Determine base coordinates
  const targetX =
    ((style.position === "custom" ? style.customPositionX : 50) / 100) *
    canvasWidth;
  const targetY =
    ((style.position === "top"
      ? 12
      : style.position === "center"
        ? 50
        : style.position === "bottom"
          ? 85
          : style.customPositionY) /
      100) *
    canvasHeight;

  // 4. Line wrapping to fit within 88% width
  const maxLineWidth = canvasWidth * 0.88;
  const spaceWidth = ctx.measureText(" ").width;

  interface LineWord {
    text: string;
    width: number;
    color: string;
    isPop: boolean;
  }

  const lines: LineWord[][] = [];
  let currentLine: LineWord[] = [];
  let currentLineWidth = 0;

  for (const w of words) {
    const wordWidth = ctx.measureText(w.text).width;
    const isWordActive = time >= w.start && time <= w.end;
    const isPast = time > w.end;

    let color = style.textColor;
    let isPop = false;

    if (style.displayMode === "word") {
      if (style.animation === "karaoke") {
        if (isWordActive || isPast) color = style.highlightColor;
      } else if (isWordActive) {
        color = style.highlightColor;
        if (style.animation === "pop") isPop = true;
      }
    }

    if (
      currentLine.length > 0 &&
      currentLineWidth + spaceWidth + wordWidth > maxLineWidth
    ) {
      lines.push(currentLine);
      currentLine = [];
      currentLineWidth = 0;
    }

    currentLine.push({ text: w.text, width: wordWidth, color, isPop });
    currentLineWidth += (currentLine.length === 1 ? 0 : spaceWidth) + wordWidth;
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  const totalHeight = lines.length * lineHeight;
  const startY = targetY - totalHeight / 2;

  // 5. Draw background box if backgroundOpacity > 0
  if (style.backgroundOpacity > 0) {
    ctx.save();
    ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
    const padX = Math.round(20 * scale);
    const padY = Math.round(12 * scale);
    const radius = Math.round(14 * scale);

    let maxW = 0;
    for (const line of lines) {
      const lineW =
        line.reduce((acc, curr) => acc + curr.width, 0) +
        (line.length - 1) * spaceWidth;
      if (lineW > maxW) maxW = lineW;
    }

    const boxX = targetX - maxW / 2 - padX;
    const boxY = startY - padY;
    const boxW = maxW + padX * 2;
    const boxH = totalHeight + padY * 2;

    roundRect(ctx, boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.restore();
  }

  // 6. Draw each line with words, shadows, and strokes
  lines.forEach((line, lineIndex) => {
    const lineW =
      line.reduce((acc, curr) => acc + curr.width, 0) +
      (line.length - 1) * spaceWidth;
    let currentX: number;
    if (style.alignment === "left") {
      currentX = targetX - maxLineWidth / 2;
    } else if (style.alignment === "right") {
      currentX = targetX + maxLineWidth / 2 - lineW;
    } else {
      currentX = targetX - lineW / 2;
    }

    const lineY = startY + lineIndex * lineHeight + lineHeight / 2;

    for (const lw of line) {
      ctx.save();

      // Word pop zoom animation
      if (lw.isPop) {
        ctx.translate(currentX + lw.width / 2, lineY);
        ctx.scale(1.14, 1.14);
        ctx.translate(-(currentX + lw.width / 2), -lineY);
      }

      // Drop shadow
      if (
        style.shadowBlur > 0 ||
        style.shadowOffsetX !== 0 ||
        style.shadowOffsetY !== 0
      ) {
        ctx.shadowColor = style.shadowColor;
        ctx.shadowBlur = Math.round(style.shadowBlur * scale);
        ctx.shadowOffsetX = Math.round(style.shadowOffsetX * scale);
        ctx.shadowOffsetY = Math.round(style.shadowOffsetY * scale);
      }

      // Stroke / Outline
      if (style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.strokeText(lw.text, currentX, lineY);
      }

      // Text fill
      ctx.fillStyle = lw.color;
      ctx.fillText(lw.text, currentX, lineY);

      ctx.restore();
      currentX += lw.width + spaceWidth;
    }
  });

  ctx.restore();
}


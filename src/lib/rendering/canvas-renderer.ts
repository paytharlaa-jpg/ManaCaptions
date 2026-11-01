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

interface MeasuredWord {
  id: string;
  text: string;
  start: number;
  end: number;
  width: number;
}

interface LayoutLine {
  words: MeasuredWord[];
  lineWidth: number;
  startX: number;
  y: number;
}

interface CachedLayout {
  key: string;
  scale: number;
  fontSize: number;
  outlineWidth: number;
  lineHeight: number;
  lines: LayoutLine[];
  box?: {
    x: number;
    y: number;
    w: number;
    h: number;
    radius: number;
  };
}

let cachedLayout: CachedLayout | null = null;

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

  const rawWords = seg.words?.length
    ? seg.words
    : [{ id: seg.id, text: seg.text, start: seg.start, end: seg.end }];

  const scale = canvasWidth / 1080;
  const fontSize = Math.max(16, Math.round(style.fontSize * scale));
  const outlineWidth = Math.max(1, Math.round(style.outlineWidth * scale * 2.2));
  const lineHeight = Math.round(fontSize * (style.lineSpacing || 1.3));

  const cacheKey = `${seg.id}_${canvasWidth}_${fontSize}_${style.fontWeight}_${style.fontFamily}_${style.position}_${style.alignment}_${style.customPositionX}_${style.customPositionY}_${style.backgroundOpacity > 0 ? 1 : 0}`;

  if (!cachedLayout || cachedLayout.key !== cacheKey) {
    ctx.font = `${style.fontWeight} ${fontSize}px "${style.fontFamily}", "Noto Sans Telugu", sans-serif`;

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

    const maxLineWidth = canvasWidth * 0.88;
    const spaceWidth = ctx.measureText(" ").width;

    const lines: LayoutLine[] = [];
    let currentLineWords: MeasuredWord[] = [];
    let currentLineWidth = 0;

    for (const w of rawWords) {
      const wordWidth = ctx.measureText(w.text).width;

      if (
        currentLineWords.length > 0 &&
        currentLineWidth + spaceWidth + wordWidth > maxLineWidth
      ) {
        lines.push({
          words: currentLineWords,
          lineWidth: currentLineWidth,
          startX: 0,
          y: 0,
        });
        currentLineWords = [];
        currentLineWidth = 0;
      }

      currentLineWords.push({
        id: w.id,
        text: w.text,
        start: w.start,
        end: w.end,
        width: wordWidth,
      });
      currentLineWidth += (currentLineWords.length === 1 ? 0 : spaceWidth) + wordWidth;
    }

    if (currentLineWords.length > 0) {
      lines.push({
        words: currentLineWords,
        lineWidth: currentLineWidth,
        startX: 0,
        y: 0,
      });
    }

    const totalHeight = lines.length * lineHeight;
    const startY = targetY - totalHeight / 2;

    let maxW = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let startX: number;
      if (style.alignment === "left") {
        startX = targetX - maxLineWidth / 2;
      } else if (style.alignment === "right") {
        startX = targetX + maxLineWidth / 2 - line.lineWidth;
      } else {
        startX = targetX - line.lineWidth / 2;
      }
      line.startX = startX;
      line.y = startY + i * lineHeight + lineHeight / 2;
      if (line.lineWidth > maxW) maxW = line.lineWidth;
    }

    let box: CachedLayout["box"] = undefined;
    if (style.backgroundOpacity > 0) {
      const padX = Math.round(20 * scale);
      const padY = Math.round(12 * scale);
      const radius = Math.round(14 * scale);

      box = {
        x: targetX - maxW / 2 - padX,
        y: startY - padY,
        w: maxW + padX * 2,
        h: totalHeight + padY * 2,
        radius,
      };
    }

    cachedLayout = {
      key: cacheKey,
      scale,
      fontSize,
      outlineWidth,
      lineHeight,
      lines,
      box,
    };
  }

  // Draw background box if present
  if (cachedLayout.box && style.backgroundOpacity > 0) {
    ctx.save();
    ctx.fillStyle = hexToRgba(style.backgroundColor, style.backgroundOpacity);
    roundRect(
      ctx,
      cachedLayout.box.x,
      cachedLayout.box.y,
      cachedLayout.box.w,
      cachedLayout.box.h,
      cachedLayout.box.radius,
    );
    ctx.fill();
    ctx.restore();
  }

  // Set font properties once for all lines
  ctx.save();
  ctx.font = `${style.fontWeight} ${fontSize}px "${style.fontFamily}", "Noto Sans Telugu", sans-serif`;
  ctx.textBaseline = "middle";

  const spaceWidth = ctx.measureText(" ").width;
  const hasShadow =
    style.shadowOffsetX !== 0 ||
    style.shadowOffsetY !== 0 ||
    style.shadowBlur > 0;
  const shadowOffX = Math.round((style.shadowOffsetX || 0) * scale);
  const shadowOffY = Math.round(
    (style.shadowOffsetY !== 0
      ? style.shadowOffsetY
      : style.shadowBlur > 0
        ? Math.max(1, Math.round(style.shadowBlur * 0.4))
        : 0) * scale,
  );
  const isNeonGlow = style.shadowBlur > 8;
  const glowSpread = Math.min(4, Math.round(style.shadowBlur * 0.15 * scale));

  for (const line of cachedLayout.lines) {
    let currentX = line.startX;

    for (const w of line.words) {
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

      if (isPop) {
        ctx.save();
        ctx.translate(currentX + w.width / 2, line.y);
        ctx.scale(1.14, 1.14);
        ctx.translate(-(currentX + w.width / 2), -line.y);
      }

      // 1. Text Shadow / Directional Glow (Zero GPU blur stalls)
      if (hasShadow) {
        ctx.fillStyle = style.shadowColor;
        if (isNeonGlow) {
          ctx.fillText(w.text, currentX + shadowOffX + glowSpread, line.y + shadowOffY);
          ctx.fillText(w.text, currentX + shadowOffX - glowSpread, line.y + shadowOffY);
          ctx.fillText(w.text, currentX + shadowOffX, line.y + shadowOffY + glowSpread);
          ctx.fillText(w.text, currentX + shadowOffX, line.y + shadowOffY - glowSpread);
        } else {
          ctx.fillText(w.text, currentX + shadowOffX, line.y + shadowOffY);
        }
      }

      // 2. Stroke / Outline (Crisp, no blur)
      if (style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.strokeText(w.text, currentX, line.y);
      }

      // 3. Text fill
      ctx.fillStyle = color;
      ctx.fillText(w.text, currentX, line.y);

      if (isPop) {
        ctx.restore();
      }

      currentX += w.width + spaceWidth;
    }
  }

  ctx.restore();
}

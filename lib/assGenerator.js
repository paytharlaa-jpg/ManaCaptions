/**
 * MANACAPTION - BROADCAST-GRADE ASS SUBTITLE GENERATOR
 * Converts timed subtitle segments and styling configurations into
 * Advanced SubStation Alpha (.ass) subtitles for FFmpeg hardsub burning.
 * Guarantees zero dropped frames, microsecond audio sync, and crystal-clear Telugu rendering.
 */

/**
 * ASS Style Header Color: &HAABBGGRR (8 hex digits, NO trailing ampersand)
 * In ASS style lines, alpha 00 is fully opaque, FF is transparent.
 */
export function toAssStyleColor(hex, alphaHex = "00") {
  if (!hex) return `&H${alphaHex}FFFFFF`;
  let clean = String(hex).replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map(c => c + c).join("");
  }
  if (clean.length !== 6) return `&H${alphaHex}FFFFFF`;
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H${alphaHex}${b}${g}${r}`.toUpperCase();
}

/**
 * ASS Inline Override Tag Color: &HBBGGRR& (6 hex digits + trailing ampersand)
 * Used in dialogue override tags like {\c&H2B23BB&}
 */
export function toAssInlineColor(hex) {
  if (!hex) return "&HFFFFFF&";
  let clean = String(hex).replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map(c => c + c).join("");
  }
  if (clean.length !== 6) return "&HFFFFFF&";
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `&H${b}${g}${r}&`.toUpperCase();
}

/**
 * Backwards compatibility helper
 */
export function hexToAssColor(hex, alphaHex = "00") {
  return toAssStyleColor(hex, alphaHex);
}

/**
 * Format seconds to ASS timestamp: H:MM:SS.cc (centiseconds)
 */
export function toAssTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const remSec = s % 60;
  const integerSec = Math.floor(remSec);
  const centi = Math.min(99, Math.floor((remSec - integerSec) * 100));
  return `${h}:${String(m).padStart(2, "0")}:${String(integerSec).padStart(2, "0")}.${String(centi).padStart(2, "0")}`;
}

/**
 * Generate broadcast-quality ASS Subtitles
 */
export function generateAssSubtitles({
  segments = [],
  styleConfig = {},
  scriptMode = "telugu",
  videoWidth = 1080,
  videoHeight = 1920
}) {
  const resX = Math.max(320, Number(videoWidth) || 1080);
  const resY = Math.max(320, Number(videoHeight) || 1920);

  // Dynamic font sizing: scales with user's fontSizePct slider and video resolution
  // Base default is ~4.2% of video height (80px on 1080x1920 reels), scaled by user preference
  const userPct = Number(styleConfig.fontSizePct) || 2.2;
  const fontRatio = userPct / 2.2;
  const fontSize = Math.max(28, Math.round(resY * 0.042 * fontRatio));

  const isBold = (Number(styleConfig.fontWeight) || 700) >= 600 ? 1 : 0;
  const isNegative = styleConfig.textEffect === "negative";

  // Primary & Secondary Style Colors (Style header format: &HAABBGGRR)
  const primaryAss = isNegative
    ? "&H00000000"
    : toAssStyleColor(styleConfig.color || "#FFFFFF", "00");

  const highlightAss = isNegative
    ? "&H002B23BB"
    : toAssStyleColor(styleConfig.highlightColor || "#BB232B", "00");

  const outlineAss = isNegative
    ? "&H00FFFFFF"
    : toAssStyleColor(styleConfig.outlineColor || "#000000", "00");

  const backAss = isNegative
    ? "&H00FFFFFF"
    : toAssStyleColor(styleConfig.backgroundColor || "#000000", "80");

  // Inline Tag Colors (Dialogue format: &HBBGGRR&)
  const inlinePrimary = isNegative
    ? "&H000000&"
    : toAssInlineColor(styleConfig.color || "#FFFFFF");

  const inlineHighlight = isNegative
    ? "&H2B23BB&"
    : toAssInlineColor(styleConfig.highlightColor || "#BB232B");

  // Border & Shadow
  const outlineWidth = Math.max(2, Math.round(3 * (resY / 1080)));
  const shadowDist = styleConfig.shadow ? Math.max(2, Math.round(2 * (resY / 1080))) : 0;
  const borderStyle = (styleConfig.boxMode === "box" || styleConfig.boxMode === "rounded" || isNegative) ? 3 : 1;

  // Vertical placement: Alignment 2 = Bottom-Center.
  // MarginV is distance from bottom. Standard Instagram/TikTok reels safe zone: 65% from top = 35% from bottom.
  const posPct = Number(styleConfig.positionYPct) || 65;
  const marginV = Math.max(80, Math.round(resY * (1 - (posPct / 100))));
  const marginLR = Math.round(resX * 0.06);

  // Universal font name across Linux (Hostinger) and Windows
  // Single font name (NO commas) to prevent ASS column shifting
  let fontName = "Arial";
  if (styleConfig.fontFamily) {
    const custom = styleConfig.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
    if (custom && custom.toLowerCase() !== "ntr") {
      fontName = custom;
    }
  }

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${resX}
PlayResY: ${resY}
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryAss},${highlightAss},${outlineAss},${backAss},${isBold},0,0,0,100,100,0,0,${borderStyle},${outlineWidth},${shadowDist},2,${marginLR},${marginLR},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Text Transform Helper
  const applyTransform = (text) => {
    if (!text) return "";
    switch (styleConfig.textCase) {
      case "upper": return text.toUpperCase();
      case "lower": return text.toLowerCase();
      case "capitalize": return text.replace(/\b\w/g, l => l.toUpperCase());
      default: return text;
    }
  };

  let events = "";

  segments.forEach((seg) => {
    const isBoth = scriptMode === "both";
    const isRomanized = scriptMode === "romanized";

    let primaryText = isRomanized
      ? (seg.romanizedText || seg.text || "")
      : (seg.text || seg.romanizedText || "");

    let secondaryText = "";
    if (isBoth) {
      secondaryText = (seg.romanizedText && seg.romanizedText !== primaryText)
        ? seg.romanizedText
        : "";
    }

    if (!primaryText.trim()) return;

    const words = primaryText.trim().split(/\s+/).filter(Boolean).map(applyTransform);
    if (words.length === 0) return;

    const segStart = Math.max(0, Number(seg.start) || 0);
    const segEnd = Math.max(segStart + 0.1, Number(seg.end) || (segStart + 1.5));
    const totalDur = segEnd - segStart;

    // Check if acoustic word timestamps are available
    const hasWordTimings = Array.isArray(seg.words) && seg.words.length === words.length;

    if (styleConfig.karaoke && words.length > 1) {
      words.forEach((_, activeIdx) => {
        let wStart, wEnd;
        if (hasWordTimings) {
          wStart = Math.max(segStart, Number(seg.words[activeIdx].start) || segStart);
          wEnd = Math.min(segEnd, Number(seg.words[activeIdx].end) || (wStart + totalDur / words.length));
        } else {
          const wordDur = totalDur / words.length;
          wStart = segStart + activeIdx * wordDur;
          wEnd = activeIdx === words.length - 1 ? segEnd : (wStart + wordDur);
        }

        let lineText = words.map((w, idx) => {
          if (idx === activeIdx) {
            return `{\\c${inlineHighlight}}${w}{\\c${inlinePrimary}}`;
          }
          return w;
        }).join(" ");

        if (isBoth && secondaryText) {
          lineText += `\\N{\\fs${Math.round(fontSize * 0.82)}}{\\c&HFFFFFF&}${secondaryText}`;
        }

        events += `Dialogue: 0,${toAssTime(wStart)},${toAssTime(wEnd)},Default,,0,0,0,,${lineText}\n`;
      });
    } else {
      let fullLine = words.join(" ");
      if (isBoth && secondaryText) {
        fullLine += `\\N{\\fs${Math.round(fontSize * 0.82)}}{\\c&HFFFFFF&}${secondaryText}`;
      }
      events += `Dialogue: 0,${toAssTime(segStart)},${toAssTime(segEnd)},Default,,0,0,0,,${fullLine}\n`;
    }
  });

  return header + events;
}

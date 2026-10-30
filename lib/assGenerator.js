
/**
 * MANACAPTION - ASS SUBTITLE GENERATOR
 * Generates styled ASS subtitles for FFmpeg video export.
 * Supports word-level karaoke highlighting using actual timestamps.
 */

/**
 * ASS Style Header Color: &HAABBGGRR
 * Alpha 00 = opaque, FF = transparent.
 */
export function toAssStyleColor(hex, alphaHex = "00") {
  if (!hex) return `&H${alphaHex}FFFFFF`;

  let clean = String(hex).replace("#", "").trim();

  if (clean.length === 3) {
    clean = clean.split("").map(c => c + c).join("");
  }

  if (clean.length !== 6) {
    return `&H${alphaHex}FFFFFF`;
  }

  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);

  return `&H${alphaHex}${b}${g}${r}`.toUpperCase();
}

/**
 * ASS Inline Override Tag Color: &HBBGGRR&
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
 * Backwards compatibility helper.
 */
export function hexToAssColor(hex, alphaHex = "00") {
  return toAssStyleColor(hex, alphaHex);
}

/**
 * Format seconds as ASS timestamp: H:MM:SS.cc
 */
export function toAssTime(sec) {
  const s = Math.max(0, Number(sec) || 0);

  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const remSec = s % 60;

  const integerSec = Math.floor(remSec);
  const centi = Math.min(
    99,
    Math.floor((remSec - integerSec) * 100)
  );

  return `${h}:${String(m).padStart(2, "0")}:${String(integerSec).padStart(2, "0")}.${String(centi).padStart(2, "0")}`;
}

/**
 * Generate ASS subtitles.
 */

/**
 * Creates ASS animation tags for individual words.
 * Animation starts when the corresponding word becomes active.
 */
function getAssWordAnimation(animation, isActive) {
  if (!isActive) return "";

  switch (animation) {
    case "pop":
      return (
        "{\\fscx75\\fscy75" +
        "\\t(0,100,\\fscx118\\fscy118)" +
        "\\t(100,220,\\fscx100\\fscy100)}"
      );

    case "fade":
      return (
        "{\\alpha&HFF&" +
        "\\t(0,180,\\alpha&H00&)}"
      );

    case "shamani":
      return (
        "{\\fscx75\\fscy75\\blur2" +
        "\\t(0,100,\\fscx120\\fscy120\\blur0)" +
        "\\t(100,240,\\fscx100\\fscy100)}"
      );

    case "pinterest":
      return (
        "{\\alpha&HFF&\\fscx94\\fscy94" +
        "\\t(0,220,\\alpha&H00&\\fscx100\\fscy100)}"
      );

    case "pinterest3":
      return (
        "{\\fscx85\\fscy85" +
        "\\t(0,180,\\fscx100\\fscy100)}"
      );

    case "pinterest4":
      return (
        "{\\alpha&HFF&\\fscx108\\fscy108" +
        "\\t(0,160,\\alpha&H00&\\fscx100\\fscy100)}"
      );

    case "stomp":
      return (
        "{\\fscx130\\fscy130" +
        "\\t(0,70,\\fscx95\\fscy95)" +
        "\\t(70,160,\\fscx100\\fscy100)}"
      );

    case "gradient-flow":
      return (
        "{\\fscx90\\fscy90" +
        "\\t(0,90,\\fscx112\\fscy112)" +
        "\\t(90,180,\\fscx100\\fscy100)}"
      );

    default:
      return "";
  }
}

export function generateAssSubtitles({
  segments = [],
  styleConfig = {},
  scriptMode = "telugu",
  videoWidth = 1080,
  videoHeight = 1920
}) {
  const resX = Math.max(320, Number(videoWidth) || 1080);
  const resY = Math.max(320, Number(videoHeight) || 1920);

  // Font sizing.
  const userPct = Number(styleConfig.fontSizePct) || 2.2;
  const fontRatio = userPct / 2.2;
  const fontSize = Math.max(
    28,
    Math.round(resY * 0.042 * fontRatio)
  );

  const isBold =
    (Number(styleConfig.fontWeight) || 700) >= 600 ? 1 : 0;

  const isNegative = styleConfig.textEffect === "negative";

  // Main colors.
  const primaryAss = isNegative
    ? "&H00000000"
    : toAssStyleColor(styleConfig.color || "#FFFFFF", "00");

  const highlightAss = isNegative
    ? "&H002B23BB"
    : toAssStyleColor(
        styleConfig.highlightColor || "#BB232B",
        "00"
      );

  const outlineAss = isNegative
    ? "&H00FFFFFF"
    : toAssStyleColor(
        styleConfig.outlineColor || "#000000",
        "00"
      );

  const backAss = isNegative
    ? "&H00FFFFFF"
    : toAssStyleColor(
        styleConfig.backgroundColor || "#000000",
        "80"
      );

  // Inline colors.
  const inlinePrimary = isNegative
    ? "&H000000&"
    : toAssInlineColor(styleConfig.color || "#FFFFFF");

  const inlineHighlight = isNegative
    ? "&H2B23BB&"
    : toAssInlineColor(
        styleConfig.highlightColor || "#BB232B"
      );

  // Border and shadow.
  const outlineWidth = Math.max(
    2,
    Math.round(3 * (resY / 1080))
  );

  const shadowDist = styleConfig.shadow
    ? Math.max(2, Math.round(2 * (resY / 1080)))
    : 0;

  const borderStyle =
    styleConfig.boxMode === "box" ||
    styleConfig.boxMode === "rounded" ||
    isNegative
      ? 3
      : 1;

  // Caption position.
  const posPct = Number(styleConfig.positionYPct) || 65;

  const marginV = Math.max(
    80,
    Math.round(resY * (1 - posPct / 100))
  );

  const marginLR = Math.round(resX * 0.06);

  // Font family: use Noto Sans Telugu for authentic Telugu script rendering
  const hasTelugu = segments.some(s => /[ఀ-౿]/.test(s.text || "") || /[ఀ-౿]/.test(s.romanizedText || ""));
  let fontName = (hasTelugu || scriptMode !== "romanized") ? "Noto Sans Telugu" : "Arial";

  if (styleConfig.fontFamily) {
    const custom = styleConfig.fontFamily
      .split(",")[0]
      .trim()
      .replace(/['"]/g, "");

    if (custom && custom.toLowerCase() !== "ntr" && !hasTelugu && scriptMode === "romanized") {
      fontName = custom;
    }
  }

  // ASS header.
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

  // Text transformation.
  const applyTransform = (text) => {
    if (!text) return "";

    switch (styleConfig.textCase) {
      case "upper":
        return text.toUpperCase();

      case "lower":
        return text.toLowerCase();

      case "capitalize":
        return text.replace(/\b\w/g, l => l.toUpperCase());

      default:
        return text;
    }
  };

  let events = "";

  segments.forEach(seg => {
    const isBoth = scriptMode === "both";
    const isRomanized = scriptMode === "romanized";

    const primaryText = isRomanized
      ? (seg.romanizedText || seg.text || "")
      : (seg.text || seg.romanizedText || "");

    let secondaryText = "";

    if (isBoth) {
      secondaryText =
        seg.romanizedText &&
        seg.romanizedText !== primaryText
          ? seg.romanizedText
          : "";
    }

    if (!primaryText.trim()) return;

    const words = primaryText
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(applyTransform);

    if (words.length === 0) return;

    const segStart = Math.max(
      0,
      Number(seg.start) || 0
    );

    const segEnd = Math.max(
      segStart + 0.1,
      Number(seg.end) || segStart + 1.5
    );

    const totalDur = segEnd - segStart;

    // Normal subtitle without karaoke.
    if (!styleConfig.karaoke || words.length <= 1) {
      let fullLine = words.join(" ");

      if (isBoth && secondaryText) {
        fullLine +=
          `\\N{\\fs${Math.round(fontSize * 0.82)}}` +
          `{\\c&HFFFFFF&}${secondaryText}`;
      }

      events +=
        `Dialogue: 0,${toAssTime(segStart)},` +
        `${toAssTime(segEnd)},Default,,0,0,0,,` +
        `${fullLine}\n`;

      return;
    }

    // Validate actual word-level timestamps.
    const hasValidWordTimings =
      Array.isArray(seg.words) &&
      seg.words.length === words.length &&
      seg.words.every(w =>
        Number.isFinite(Number(w.start)) &&
        Number.isFinite(Number(w.end)) &&
        Number(w.end) > Number(w.start)
      );

    // Use acoustic timestamps when available.
    // Otherwise use equal-duration fallback.
    const wordDur = totalDur / words.length;

    const wordTimings = words.map((word, index) => {
      let start;
      let end;

      if (hasValidWordTimings) {
        start = Number(seg.words[index].start);
        end = Number(seg.words[index].end);
      } else {
        start = segStart + index * wordDur;
        end = segStart + (index + 1) * wordDur;
      }

      return {
        start: Math.max(segStart, start),
        end: Math.min(segEnd, end)
      };
    });

    // Create timeline boundaries from individual words.
    const boundaries = [
      segStart,
      segEnd,
      ...wordTimings.flatMap(w => [
        w.start,
        w.end
      ])
    ]
      .filter(t =>
        Number.isFinite(t) &&
        t >= segStart &&
        t <= segEnd
      )
      .sort((a, b) => a - b)
      .filter((t, index, arr) =>
        index === 0 || t - arr[index - 1] > 0.001
      );

    // Render each timeline interval.
    for (let i = 0; i < boundaries.length - 1; i++) {
      const intervalStart = boundaries[i];
      const intervalEnd = boundaries[i + 1];

      if (intervalEnd <= intervalStart) continue;

      // Avoid zero-duration ASS events after centisecond rounding.
      if (toAssTime(intervalStart) === toAssTime(intervalEnd)) {
        continue;
      }

      const midpoint = (intervalStart + intervalEnd) / 2;

      const activeIndex = wordTimings.findIndex(w =>
        midpoint >= w.start && midpoint < w.end
      );

      // Only the currently spoken word is highlighted.
     
// Highlight and animate only the currently spoken word.
const lineText = words
  .map((word, index) => {
    const isActive = index === activeIndex;

    const color = isActive
      ? inlineHighlight
      : inlinePrimary;

    const animationTag = getAssWordAnimation(
      styleConfig.animation || "pop",
      isActive
    );

    return `${animationTag}{\\c${color}}${word}{\\rDefault}`;
  })
  .join(" ");


      let captionText = lineText;

      if (isBoth && secondaryText) {
        captionText +=
          `\\N{\\fs${Math.round(fontSize * 0.82)}}` +
          `{\\c&HFFFFFF&}${secondaryText}`;
      }

      events +=
        `Dialogue: 0,${toAssTime(intervalStart)},` +
        `${toAssTime(intervalEnd)},Default,,0,0,0,,` +
        `${captionText}\n`;
    }
  });

  return header + events;
}

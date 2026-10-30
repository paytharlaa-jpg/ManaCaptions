
"use client";

import React, { useMemo } from "react";

export default function CaptionOverlay({
  segments = [],
  currentTime = 0,
  styleConfig,
  scriptMode = "telugu",
  isPlaying = false
}) {
  // Use actual video playback time.
  // No artificial offset or early caption anticipation.
  const playheadTime = currentTime;

  // Find the active caption using actual timestamps.
  const activeSegment = useMemo(() => {
    // Exact caption timing.
    const exact = segments.find(
      seg =>
        playheadTime >= seg.start &&
        playheadTime <= seg.end
    );

    if (exact) return exact;

    // Small buffer only after the caption's end.
    const buffer = segments.find(
      seg =>
        playheadTime >= seg.start &&
        playheadTime <= (seg.end + 0.06)
    );

    if (buffer) return buffer;

    // Keep the closest caption visible when video is paused.
    if (!isPlaying && segments.length > 0) {
      let closest = segments[0];
      let minDiff = Math.abs(currentTime - closest.start);

      for (const seg of segments) {
        const diff = Math.min(
          Math.abs(currentTime - seg.start),
          Math.abs(currentTime - seg.end)
        );

        if (diff < minDiff) {
          minDiff = diff;
          closest = seg;
        }
      }

      return closest;
    }

    return null;
  }, [segments, playheadTime, currentTime, isPlaying]);

  if (!activeSegment) return null;

  // Preserve the original transcript text.
  const teText =
    activeSegment.text ||
    activeSegment.romanizedText ||
    "";

  const enText =
    activeSegment.romanizedText ||
    activeSegment.text ||
    "";

  const isBoth = scriptMode === "both";
  const isRomanized = scriptMode === "romanized";

  let rawText = isRomanized ? enText : teText;

  if (!rawText.trim()) {
    rawText = enText || teText;
  }

  if (!rawText.trim()) return null;

  // Split caption text into words.
  const textWords = rawText.trim().split(/\s+/).filter(Boolean);

  // Use actual acoustic word timestamps when available.
  let words = [];

  if (
    Array.isArray(activeSegment.words) &&
    activeSegment.words.length > 0
  ) {
    words = activeSegment.words
      .map((w, idx) => {
        const wordText = isRomanized
          ? (w.romanized || textWords[idx] || w.word || "")
          : (w.word || textWords[idx] || w.romanized || "");

        return {
          word: wordText,
          start:
            typeof w.start === "number"
              ? w.start
              : activeSegment.start,
          end:
            typeof w.end === "number"
              ? w.end
              : activeSegment.end
        };
      })
      .filter(w => w.word && w.word.trim());
  }

  // Fallback when word-level timestamps are unavailable.
  if (words.length === 0) {
    const totalDuration = Math.max(
      0.1,
      activeSegment.end - activeSegment.start
    );

    const wordDuration =
      totalDuration / Math.max(1, textWords.length);

    words = textWords.map((word, idx) => ({
      word,
      start: activeSegment.start + idx * wordDuration,
      end: activeSegment.start + (idx + 1) * wordDuration
    }));
  }

  // Apply text transformations.
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

  // Caption positioning and layout.
  const containerStyle = {
    top: `${styleConfig.positionYPct}%`,
    maxWidth: `${styleConfig.maxWidthPct}%`,
    transform: "translate(-50%, -50%)",
    textAlign: styleConfig.align || "center",
    letterSpacing: `${styleConfig.letterSpacingEm || 0}em`,
    lineHeight: styleConfig.lineHeight || 1.1,
    whiteSpace: "nowrap"
  };

  // Outline.
  const textStroke =
    styleConfig.outlineWidth && styleConfig.outlineWidth > 0
      ? `${styleConfig.outlineWidth}px ${styleConfig.outlineColor || "#000000"}`
      : "none";

  // Text shadow.
  const textShadow = styleConfig.shadow
    ? "0px 3px 12px rgba(0,0,0,0.85), 0px 1px 3px rgba(0,0,0,0.9)"
    : styleConfig.glowStrength > 0
      ? `0 0 ${styleConfig.glowStrength * 10}px ${
          styleConfig.glowColor || styleConfig.highlightColor
        }`
      : "none";

  // Background color helper.
  const getBoxBackground = () => {
    const raw = styleConfig.backgroundColor || "#000000";

    const op =
      typeof styleConfig.backgroundOpacity === "number"
        ? styleConfig.backgroundOpacity
        : 0.85;

    if (op <= 0) return "transparent";

    if (raw.startsWith("#")) {
      let hex = raw.replace("#", "");

      if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
      }

      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${op})`;
      }
    }

    return raw;
  };

  const boxBgColor = getBoxBackground();
  const isNegative = styleConfig.textEffect === "negative";

  return (
    <div
      className="absolute left-1/2 pointer-events-none z-20 flex flex-col justify-center items-center select-none"
      style={containerStyle}
    >
      <div
        className={`inline-flex flex-nowrap whitespace-nowrap items-center justify-center gap-x-2 transition-all duration-75 ${
          styleConfig.animation === "pop"
            ? "animate-caption-pop"
            : ""
        } ${
          styleConfig.animation === "fade"
            ? "animate-caption-fade"
            : ""
        } ${
          isNegative
            ? "bg-white text-black px-4 py-2 rounded-lg mix-blend-screen"
            : ""
        }`}
        style={{
          fontFamily: styleConfig.fontFamily || "NTR",
          fontWeight: styleConfig.fontWeight || 700,
          fontSize: `calc(${styleConfig.fontSizePct} * 1vh)`,
          color: isNegative
            ? "#000000"
            : (styleConfig.color || "#FFFFFF"),
          textShadow: isNegative ? "none" : textShadow,
          backgroundColor:
            styleConfig.boxMode === "box" ||
            styleConfig.boxMode === "rounded"
              ? boxBgColor
              : "transparent",
          padding:
            styleConfig.boxMode === "box" ||
            styleConfig.boxMode === "rounded"
              ? `${styleConfig.bgPaddingYPct || 0.6}rem ${
                  styleConfig.bgPaddingXPct || 1.2
                }rem`
              : "0",
          borderRadius:
            styleConfig.boxMode === "rounded"
              ? "1rem"
              : styleConfig.boxMode === "box"
                ? "0.35rem"
                : "0"
        }}
      >
        {words.map((w, idx) => {
          // Karaoke highlighting follows exact word timestamps.
          const isWordActive =
            playheadTime >= w.start &&
            playheadTime <= w.end;
            console.log("KARAOKE DEBUG:", {
  currentTime: playheadTime,
  word: w.word,
  start: w.start,
  end: w.end,
  active: isWordActive,
  karaoke: styleConfig.karaoke,
  color: styleConfig.color,
  highlightColor: styleConfig.highlightColor
});

          const isKaraokeActive =
            styleConfig.karaoke && isWordActive;

          let wordColor = styleConfig.color || "#FFFFFF";

          if (isNegative) {
            wordColor = "#000000";
          } else if (isKaraokeActive) {
            wordColor =
              styleConfig.highlightColor || "#FF3B30";
          }

          const hasGradient = isKaraokeActive && Boolean(styleConfig.gradientHighlight || styleConfig.animation === "gradient-flow");
          const activeGradient = styleConfig.gradientHighlight || "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)";

          return (
            <span
              key={idx}
              className={`transition-all duration-100 ${
                isKaraokeActive
                  ? "scale-110 drop-shadow-lg inline-block font-black"
                  : "inline-block"
              } ${
                styleConfig.boxMode === "inline"
                  ? "px-2 py-0.5 rounded-md"
                  : ""
              }`}
              style={{
                color: hasGradient ? "transparent" : wordColor,
                background: hasGradient ? activeGradient : (styleConfig.boxMode === "inline" ? boxBgColor : "transparent"),
                WebkitBackgroundClip: hasGradient ? "text" : "initial",
                WebkitTextFillColor: hasGradient ? "transparent" : (isNegative ? "#000000" : wordColor),
                paintOrder: "stroke fill",
                WebkitTextStroke: (isNegative || hasGradient) ? "none" : textStroke,
                transform: isKaraokeActive
                  ? (styleConfig.animation === "stomp" ? "scale(1.22) translateY(-2px)" : "scale(1.08)")
                  : "scale(1)"
              }}
            >
              {applyTransform(w.word)}
            </span>
          );
        })}
      </div>

      {/* Secondary Romanized Line */}
      {isBoth &&
        enText &&
        teText &&
        enText.trim().toLowerCase() !==
          teText.trim().toLowerCase() && (
          <div
            className="mt-1.5 px-3 py-1 rounded-lg bg-black/80 text-white font-semibold tracking-wide text-center border border-white/15 shadow-xl"
            style={{
              fontSize: `calc(${styleConfig.fontSizePct || 4} * 0.58vh)`,
              fontFamily: "Inter, system-ui, sans-serif"
            }}
          >
            {enText}
          </div>
        )}
    </div>
  );
}

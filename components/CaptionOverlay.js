"use client";

import React, { useMemo } from "react";
import { romanizedToTelugu } from "@/lib/transliterate";

export default function CaptionOverlay({
  segments = [],
  currentTime = 0,
  styleConfig,
  scriptMode = "telugu",
  isPlaying = false
}) {
  // Dynamic audio sync offset (anticipates speech onset so captions hit exactly on voice)
  const syncOffset = typeof styleConfig?.syncOffset === "number" ? styleConfig.syncOffset : 0.16;
  const playheadTime = isPlaying ? (currentTime + syncOffset) : currentTime;

  // Find current active segment based on playhead time
  const activeSegment = useMemo(() => {
    // 1. Exact match with voice
    const exact = segments.find(
      seg => playheadTime >= seg.start && playheadTime <= seg.end
    );
    if (exact) return exact;

    // 2. Micro-buffer match (anticipates voice onset by 0.10s, completes on speech end)
    const buffer = segments.find(
      seg => playheadTime >= (seg.start - 0.08) && playheadTime <= (seg.end + 0.06)
    );
    if (buffer) return buffer;

    // 3. Fallback when paused so styling and colors are ALWAYS visible on video
    if (!isPlaying && segments.length > 0) {
      let closest = segments[0];
      let minDiff = Math.abs(currentTime - segments[0].start);
      for (const seg of segments) {
        const diff = Math.min(Math.abs(currentTime - seg.start), Math.abs(currentTime - seg.end));
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

  // Use verbatim texts as spoken by speaker without translating English into Telugu!
  const teText = activeSegment.text || activeSegment.romanizedText || "";
  const enText = activeSegment.romanizedText || activeSegment.text || "";

  const isBoth = scriptMode === "both";
  const isRomanized = scriptMode === "romanized";

  // Primary text to display in the main karaoke box (verbatim as speaker says)
  let rawText = isRomanized ? enText : teText;
  if (!rawText.trim()) rawText = enText || teText;
  if (!rawText.trim()) return null;

  // Dynamically compute word items from activeSegment.words (real acoustic timestamps) or fallback
  const textWords = rawText.trim().split(/\s+/).filter(Boolean);

  let words = [];
  if (Array.isArray(activeSegment.words) && activeSegment.words.length > 0) {
    words = activeSegment.words.map((w, idx) => {
      let wordText = isRomanized
        ? (w.romanized || textWords[idx] || w.word || "")
        : (w.word || textWords[idx] || w.romanized || "");
      return {
        word: wordText,
        start: typeof w.start === "number" ? w.start : activeSegment.start,
        end: typeof w.end === "number" ? w.end : activeSegment.end
      };
    }).filter(w => w.word && w.word.trim());
  }

  // Fallback to proportional division if no explicit word timestamps exist
  if (words.length === 0) {
    const totalDuration = Math.max(0.1, activeSegment.end - activeSegment.start);
    const wordDuration = totalDuration / Math.max(1, textWords.length);
    words = textWords.map((word, idx) => ({
      word,
      start: activeSegment.start + idx * wordDuration,
      end: activeSegment.start + (idx + 1) * wordDuration
    }));
  }

  // Apply Text Transform (UPPERCASE, lowercase, capitalize, etc.)
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

  // Build Style Properties
  const containerStyle = {
    top: `${styleConfig.positionYPct}%`,
    maxWidth: `${styleConfig.maxWidthPct}%`,
    transform: "translate(-50%, -50%)",
    textAlign: styleConfig.align || "center",
    letterSpacing: `${styleConfig.letterSpacingEm || 0}em`,
    lineHeight: styleConfig.lineHeight || 1.1,
    whiteSpace: "nowrap"
  };

  // Outline style helper
  const textStroke = (styleConfig.outlineWidth && styleConfig.outlineWidth > 0)
    ? `${styleConfig.outlineWidth}px ${styleConfig.outlineColor || '#000000'}`
    : "none";

  // Text Shadow
  const textShadow = styleConfig.shadow
    ? "0px 3px 12px rgba(0,0,0,0.85), 0px 1px 3px rgba(0,0,0,0.9)"
    : styleConfig.glowStrength > 0
    ? `0 0 ${styleConfig.glowStrength * 10}px ${styleConfig.glowColor || styleConfig.highlightColor}`
    : "none";

  // Robust RGBA background color helper
  const getBoxBackground = () => {
    const raw = styleConfig.backgroundColor || "#000000";
    const op = typeof styleConfig.backgroundOpacity === "number" ? styleConfig.backgroundOpacity : 0.85;
    if (op <= 0) return "transparent";
    if (raw.startsWith("#")) {
      let hex = raw.replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
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
          styleConfig.animation === "pop" ? "animate-caption-pop" : ""
        } ${styleConfig.animation === "fade" ? "animate-caption-fade" : ""} ${
          isNegative ? "bg-white text-black px-4 py-2 rounded-lg mix-blend-screen" : ""
        }`}
        style={{
          fontFamily: styleConfig.fontFamily || "NTR",
          fontWeight: styleConfig.fontWeight || 700,
          fontSize: `calc(${styleConfig.fontSizePct} * 1vh)`,
          color: isNegative ? "#000000" : (styleConfig.color || "#FFFFFF"),
          textShadow: isNegative ? "none" : textShadow,
          backgroundColor:
            styleConfig.boxMode === "box" || styleConfig.boxMode === "rounded"
              ? boxBgColor
              : "transparent",
          padding:
            styleConfig.boxMode === "box" || styleConfig.boxMode === "rounded"
              ? `${styleConfig.bgPaddingYPct || 0.6}rem ${styleConfig.bgPaddingXPct || 1.2}rem`
              : "0",
          borderRadius:
            styleConfig.boxMode === "rounded" ? "1rem" : styleConfig.boxMode === "box" ? "0.35rem" : "0"
        }}
      >
        {words.map((w, idx) => {
          const isWordActive = playheadTime >= w.start && playheadTime <= (w.end + 0.05);
          const isKaraokeActive = styleConfig.karaoke && isWordActive;

          // Word fill color calculation
          let wordColor = styleConfig.color || "#FFFFFF";
          if (isNegative) {
            wordColor = "#000000";
          } else if (isKaraokeActive) {
            wordColor = styleConfig.highlightColor || "#FF3B30";
          }

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
                color: wordColor,
                WebkitTextFillColor: wordColor,
                paintOrder: "stroke fill",
                WebkitTextStroke: isNegative ? "none" : textStroke,
                backgroundColor:
                  styleConfig.boxMode === "inline"
                    ? boxBgColor
                    : "transparent",
                transform: isKaraokeActive ? "scale(1.08)" : "scale(1)",
              }}
            >
              {applyTransform(w.word)}
            </span>
          );
        })}
      </div>

      {/* Dual Script Secondary Line (Only shown when native script and Romanized line are distinct) */}
      {isBoth && enText && teText && enText.trim().toLowerCase() !== teText.trim().toLowerCase() && (
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

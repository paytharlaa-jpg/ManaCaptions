"use client";

import React from "react";
import { Sparkles, Crown } from "lucide-react";
import { STYLE_PRESETS } from "@/lib/presets";

export default function TemplatesPanel({
  styleConfig,
  setStyleConfig = () => {}
}) {
  // Built-in presets mapped directly to ReplixCaptions cards
  const templatesList = [
    {
      id: "yellow",
      name: "Yellow",
      category: "standard",
      sample: "sy ga chesukovac",
      textColor: "#FFE600",
      bgClass: "bg-[#0F1016]",
      style: {
        fontFamily: "Poppins",
        fontWeight: 800,
        fontSizePct: 2.5,
        color: "#FFE600",
        highlightColor: "#FFFFFF",
        outlineWidth: 2,
        outlineColor: "#000000",
        shadow: true,
        boxMode: "none",
        textCase: "none",
        karaoke: true,
        animation: "pop"
      }
    },
    {
      id: "minimal",
      name: "Minimal",
      category: "standard",
      sample: "sy ga chesukovac",
      textColor: "#FFFFFF",
      bgClass: "bg-[#181A24]",
      style: {
        fontFamily: "Inter Tight",
        fontWeight: 600,
        fontSizePct: 2.2,
        color: "#FFFFFF",
        highlightColor: "#E5C583",
        outlineWidth: 0,
        shadow: false,
        boxMode: "none",
        textCase: "none",
        karaoke: true,
        animation: "fade"
      }
    }
  ];

  const animatedList = [
    {
      id: "classic",
      name: "Classic",
      tag: null,
      sample: "sy ga chesukovac",
      textColor: "#FF7A00",
      bgClass: "bg-[#14151D]",
      style: {
        fontFamily: "Poppins",
        fontWeight: 700,
        fontSizePct: 2.6,
        color: "#FFFFFF",
        highlightColor: "#FF512F",
        gradientHighlight: "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)",
        outlineWidth: 2,
        outlineColor: "#000000",
        shadow: true,
        boxMode: "none",
        textCase: "none",
        karaoke: true,
        animation: "gradient-flow"
      }
    },
    {
      id: "dark",
      name: "Dark",
      tag: null,
      sample: "sy ga chesukovac",
      textColor: "#FFFFFF",
      bgClass: "bg-[#08090D]",
      style: {
        fontFamily: "Inter Tight",
        fontWeight: 700,
        fontSizePct: 2.3,
        color: "#FFFFFF",
        highlightColor: "#E5C583",
        backgroundColor: "#000000",
        backgroundOpacity: 0.85,
        boxMode: "rounded",
        outlineWidth: 0,
        shadow: true,
        textCase: "none",
        karaoke: true,
        animation: "pop"
      }
    },
    {
      id: "punch",
      name: "Punch",
      tag: "CREATOR",
      sample: "y ga chesukovac",
      textColor: "#FFCC00",
      bgClass: "bg-[#12131A]",
      style: {
        fontFamily: "Poppins",
        fontWeight: 800,
        fontSizePct: 2.8,
        color: "#FFFFFF",
        highlightColor: "#FFCC00",
        outlineWidth: 3,
        outlineColor: "#000000",
        shadow: true,
        boxMode: "none",
        textCase: "none",
        karaoke: true,
        animation: "stomp"
      }
    },
    {
      id: "glow",
      name: "Glow",
      tag: "CREATOR",
      sample: "y ga cliesukovac",
      textColor: "#00F0FF",
      bgClass: "bg-[#12131A]",
      style: {
        fontFamily: "Montserrat",
        fontWeight: 800,
        fontSizePct: 2.4,
        color: "#FFFFFF",
        highlightColor: "#00F0FF",
        glowStrength: 1.8,
        glowColor: "#00F0FF",
        outlineWidth: 1,
        outlineColor: "#000000",
        shadow: true,
        boxMode: "none",
        textCase: "none",
        karaoke: true,
        animation: "pop"
      }
    },
    {
      id: "spotlight",
      name: "Spotlight",
      tag: "CREATOR",
      sample: "ga chesukovac",
      textColor: "#E5C583",
      bgClass: "bg-[#12131A]",
      style: {
        fontFamily: "Poppins",
        fontWeight: 700,
        fontSizePct: 2.5,
        color: "#A0A4B8",
        highlightColor: "#FFFFFF",
        outlineWidth: 2,
        outlineColor: "#000000",
        shadow: true,
        boxMode: "none",
        textCase: "none",
        karaoke: true,
        animation: "pop"
      }
    },
    {
      id: "reel",
      name: "Reel",
      tag: "CREATOR",
      sample: "sy ga CHESUKOVAC",
      textColor: "#FF3366",
      bgClass: "bg-[#12131A]",
      style: {
        fontFamily: "Inter Tight",
        fontWeight: 800,
        fontSizePct: 2.5,
        color: "#FFFFFF",
        highlightColor: "#FF3366",
        outlineWidth: 2,
        outlineColor: "#000000",
        shadow: true,
        boxMode: "box",
        backgroundColor: "#000000",
        backgroundOpacity: 0.6,
        textCase: "upper",
        karaoke: true,
        animation: "pop"
      }
    }
  ];

  const applyTemplate = (item) => {
    setStyleConfig(prev => ({
      ...prev,
      ...item.style
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#12131A] rounded-xl border border-[#232634] overflow-hidden select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#232634] bg-[#0F1016] shrink-0">
        <span className="text-xs font-bold tracking-wider text-[#FFFFFF] uppercase">
          Templates
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-[#252838]">
        {/* Section 1: TEMPLATES */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7082] block mb-2 px-1">
            Templates
          </span>
          <div className="grid grid-cols-2 gap-2">
            {templatesList.map(item => {
              const isSelected = styleConfig?.color === item.style.color && styleConfig?.fontFamily === item.style.fontFamily;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${item.bgClass} ${
                    isSelected
                      ? "border-[#E5C583] ring-1 ring-[#E5C583] shadow-md shadow-[#E5C583]/15"
                      : "border-[#232634] hover:border-[#3E4256]"
                  }`}
                >
                  <span
                    className="text-xs font-bold truncate block"
                    style={{ color: item.textColor }}
                  >
                    {item.sample}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-[#8A8E9F] mt-auto">
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: ANIMATED */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7082] block mb-2 px-1">
            Animated
          </span>
          <div className="grid grid-cols-2 gap-2">
            {animatedList.map(item => {
              const isSelected = styleConfig?.highlightColor === item.style.highlightColor && styleConfig?.animation === item.style.animation;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${item.bgClass} ${
                    isSelected
                      ? "border-[#E5C583] ring-1 ring-[#E5C583] shadow-md shadow-[#E5C583]/15"
                      : "border-[#232634] hover:border-[#3E4256]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className="text-xs font-bold truncate block"
                      style={{ color: item.textColor }}
                    >
                      {item.sample}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8A8E9F] mt-auto">
                    <span>{item.name}</span>
                    {item.tag && (
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-[#E5C583]/15 text-[#E5C583] border border-[#E5C583]/30">
                        {item.tag}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


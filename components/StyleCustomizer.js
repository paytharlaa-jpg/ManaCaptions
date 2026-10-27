"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Type,
  Palette,
  Sliders,
  MoveVertical,
  Check,
  Flame,
  Layout,
  Layers,
  Wand2
} from "lucide-react";
import { STYLE_PRESETS, AVAILABLE_FONTS } from "@/lib/presets";

export default function StyleCustomizer({ styleConfig, setStyleConfig }) {
  const [activeTab, setActiveTab] = useState("presets"); // 'presets' | 'typography' | 'colors' | 'position'

  // Apply preset
  const applyPreset = (preset) => {
    setStyleConfig({
      ...preset.style
    });
  };

  // Update specific style field
  const updateStyle = (key, val) => {
    setStyleConfig(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f26]/85 backdrop-blur-xl rounded-2xl border border-[#20309A]/40 p-4 shadow-2xl shadow-[#20309A]/15 overflow-hidden min-h-0 relative">
      {/* Panel Header & Tabs */}
      <div className="pb-3 border-b border-[#20309A]/25">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#F8F3F0] flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#2e44d4]" />
            <span>Styles 2.0 Studio</span>
          </h2>
          <span className="text-[10px] font-mono bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 px-2.5 py-0.5 rounded-full font-bold shadow-sm shadow-[#BB232B]/20">
            9 Royal Presets
          </span>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-4 gap-1 bg-[#060919] p-1 rounded-xl border border-[#20309A]/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab("presets")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "presets"
                ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
          <button
            onClick={() => setActiveTab("typography")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "typography"
                ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Font</span>
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "colors"
                ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Colors</span>
          </button>
          <button
            onClick={() => setActiveTab("position")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              activeTab === "position"
                ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
          >
            <MoveVertical className="w-3.5 h-3.5" />
            <span>Layout</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-3 pr-1 space-y-4">
        {/* TAB 1: PRESETS */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {STYLE_PRESETS.map(preset => {
              const isSelected =
                styleConfig.fontFamily === preset.style.fontFamily &&
                styleConfig.karaoke === preset.style.karaoke &&
                styleConfig.boxMode === preset.style.boxMode &&
                styleConfig.textEffect === preset.style.textEffect;

              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? "bg-[#0d1640] border-[#20309A] ring-1 ring-[#20309A] shadow-xl shadow-[#20309A]/30"
                      : "bg-[#060919]/70 border-[#20309A]/30 hover:border-[#20309A]/60 hover:bg-[#080d2b]/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#F8F3F0]">{preset.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a0f2b] text-[#F8F3F0]/70 border border-[#20309A]/40">
                      {preset.tag}
                    </span>
                  </div>

                  {/* Sample visual preview box */}
                  <div className="h-14 bg-black/80 rounded-lg flex items-center justify-center p-2 overflow-hidden border border-[#20309A]/30">
                    <span
                      style={{
                        fontFamily: preset.style.fontFamily,
                        fontSize: "12px",
                        fontWeight: preset.style.fontWeight,
                        color: preset.style.color,
                        letterSpacing: `${preset.style.letterSpacingEm}em`,
                        textTransform: preset.style.textCase === "upper" ? "uppercase" : "none"
                      }}
                      className="truncate"
                    >
                      {preset.sample}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#F8F3F0]/60 mt-2 line-clamp-1">
                    {preset.description}
                  </p>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-to-r from-[#BB232B] to-[#d82a34] text-[#F8F3F0] flex items-center justify-center shadow-md shadow-[#BB232B]/40">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 2: TYPOGRAPHY */}
        {activeTab === "typography" && (
          <div className="space-y-4">
            {/* Font Family Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#F8F3F0] mb-1.5">
                Font Family
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {AVAILABLE_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => updateStyle("fontFamily", font.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                      styleConfig.fontFamily === font.id
                        ? "bg-[#0d1640] border-[#20309A] text-[#F8F3F0] shadow-md shadow-[#20309A]/30"
                        : "bg-[#060919] border-[#20309A]/30 text-[#F8F3F0]/70 hover:border-[#20309A]/60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{font.name}</div>
                      <div className="text-[10px] text-[#F8F3F0]/50 font-sans">{font.category}</div>
                    </div>
                    <span
                      className="text-sm px-2 py-0.5 rounded bg-[#0a0f2b] border border-[#20309A]/40"
                      style={{ fontFamily: font.id }}
                    >
                      {font.preview}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider with Wide Range (0.8% to 14.0%) and Direct Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F8F3F0]/80">Caption Size (% of video height)</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0.8"
                    max="14.0"
                    step="0.1"
                    value={styleConfig.fontSizePct}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0.5 && v <= 20) {
                        updateStyle("fontSizePct", Number(v.toFixed(1)));
                      }
                    }}
                    className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-[#060919] border border-[#20309A]/50 rounded text-[#BB232B] focus:outline-none focus:border-[#BB232B]"
                  />
                  <span className="text-xs text-[#F8F3F0]/50 font-mono">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0.8"
                max="14.0"
                step="0.1"
                value={styleConfig.fontSizePct}
                onChange={e => updateStyle("fontSizePct", parseFloat(e.target.value))}
                className="w-full accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
              />
              {/* Quick Size Presets */}
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {[
                  { label: "1.5% Sub", val: 1.5 },
                  { label: "2.0% Default", val: 2.0 },
                  { label: "2.6% Standard", val: 2.6 },
                  { label: "4.0% Bold", val: 4.0 },
                  { label: "6.5% Viral", val: 6.5 }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => updateStyle("fontSizePct", p.val)}
                    className={`py-1 text-[10px] rounded font-semibold transition-all cursor-pointer border ${
                      Math.abs(styleConfig.fontSizePct - p.val) < 0.2
                        ? "bg-[#BB232B] text-[#F8F3F0] border-[#BB232B] shadow-sm shadow-[#BB232B]/40"
                        : "bg-[#060919] text-[#F8F3F0]/70 border-[#20309A]/30 hover:border-[#20309A] hover:text-[#F8F3F0]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Case Mode */}
            <div>
              <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                Text Casing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "none", label: "Normal" },
                  { id: "upper", label: "UPPERCASE" },
                  { id: "lower", label: "lowercase" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => updateStyle("textCase", opt.id)}
                    className={`py-2 px-2 text-xs rounded-lg border text-center transition-all cursor-pointer ${
                      styleConfig.textCase === opt.id
                        ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold border-[#20309A] shadow-md shadow-[#20309A]/30"
                        : "bg-[#060919] text-[#F8F3F0]/70 border-[#20309A]/30 hover:bg-[#0a0f2b]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height & Letter Spacing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-[#F8F3F0]/80 font-semibold block mb-1">
                  Line Height: {styleConfig.lineHeight}
                </span>
                <input
                  type="range"
                  min="0.85"
                  max="1.5"
                  step="0.05"
                  value={styleConfig.lineHeight}
                  onChange={e => updateStyle("lineHeight", parseFloat(e.target.value))}
                  className="w-full accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <span className="text-xs text-[#F8F3F0]/80 font-semibold block mb-1">
                  Letter Spacing: {styleConfig.letterSpacingEm}em
                </span>
                <input
                  type="range"
                  min="-0.05"
                  max="0.08"
                  step="0.01"
                  value={styleConfig.letterSpacingEm}
                  onChange={e => updateStyle("letterSpacingEm", parseFloat(e.target.value))}
                  className="w-full accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLORS & EFFECTS */}
        {activeTab === "colors" && (
          <div className="space-y-4">
            {/* Primary Text Color */}
            <div className="p-3 bg-[#060919] rounded-xl border border-[#20309A]/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#F8F3F0] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#2e44d4]" />
                  <span>Primary Text Color</span>
                </label>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0a0f2b] border border-[#20309A]/40 text-[#BB232B]">
                  {styleConfig.color}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={styleConfig.color || "#FFFFFF"}
                  onChange={e => {
                    setStyleConfig(prev => ({
                      ...prev,
                      color: e.target.value,
                      textEffect: "none"
                    }));
                  }}
                  className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                />
                <input
                  type="text"
                  value={styleConfig.color || "#FFFFFF"}
                  onChange={e => {
                    setStyleConfig(prev => ({
                      ...prev,
                      color: e.target.value,
                      textEffect: "none"
                    }));
                  }}
                  className="w-24 px-2 py-1 bg-[#0a0f2b] border border-[#20309A]/40 rounded font-mono text-xs text-[#F8F3F0] uppercase"
                />
                {/* Palette quick buttons */}
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {[
                    { color: "#F8F3F0", name: "Light Cream" },
                    { color: "#FFFFFF", name: "White" },
                    { color: "#BB232B", name: "Tomato Red" },
                    { color: "#20309A", name: "Royal Blue" },
                    { color: "#FFE600", name: "Neon Yellow" },
                    { color: "#FFD400", name: "Gold" },
                    { color: "#00F0FF", name: "Cyan" },
                    { color: "#00FF66", name: "Neon Green" },
                    { color: "#111111", name: "Dark" }
                  ].map(item => (
                    <button
                      key={item.color}
                      onClick={() => {
                        setStyleConfig(prev => ({
                          ...prev,
                          color: item.color,
                          textEffect: "none"
                        }));
                      }}
                      className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                        styleConfig.color?.toLowerCase() === item.color.toLowerCase()
                          ? "ring-2 ring-[#BB232B] scale-110 border-white"
                          : "border-white/20 hover:scale-105"
                      }`}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Karaoke Mode Toggle & Highlight Color */}
            <div className="p-3 bg-[#060919] rounded-xl border border-[#20309A]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#F8F3F0] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#BB232B]" />
                    <span>Viral Karaoke Highlighting</span>
                  </div>
                  <p className="text-[10px] text-[#F8F3F0]/60">
                    Syncs word-by-word with active speech cadence
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={styleConfig.karaoke}
                  onChange={e => updateStyle("karaoke", e.target.checked)}
                  className="w-4 h-4 accent-[#BB232B] rounded cursor-pointer"
                />
              </div>

              {styleConfig.karaoke && (
                <div className="pt-2 border-t border-[#20309A]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F8F3F0]/70">Active Highlight Color:</span>
                    <span className="font-mono text-[#BB232B] font-bold">{styleConfig.highlightColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={styleConfig.highlightColor || "#BB232B"}
                      onChange={e => updateStyle("highlightColor", e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { color: "#BB232B", name: "Tomato Red" },
                        { color: "#20309A", name: "Royal Blue" },
                        { color: "#FFD400", name: "Gold" },
                        { color: "#C8FF00", name: "Lime" },
                        { color: "#00F0FF", name: "Cyan" },
                        { color: "#F8F3F0", name: "Light Cream" },
                        { color: "#FFFFFF", name: "White" }
                      ].map(item => (
                        <button
                          key={item.color}
                          onClick={() => updateStyle("highlightColor", item.color)}
                          className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                            styleConfig.highlightColor?.toLowerCase() === item.color.toLowerCase()
                              ? "ring-2 ring-[#BB232B] scale-110 border-white"
                              : "border-white/20 hover:scale-105"
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Outline Stroke Width & Outline Color */}
            <div className="p-3 bg-[#060919] rounded-xl border border-[#20309A]/40 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#F8F3F0]/80">Stroke Outline (Border)</span>
                <span className="font-mono text-[#BB232B] font-bold">{styleConfig.outlineWidth || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={styleConfig.outlineWidth || 0}
                onChange={e => updateStyle("outlineWidth", parseInt(e.target.value))}
                className="w-full accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
              />
              {(styleConfig.outlineWidth || 0) > 0 && (
                <div className="pt-2 border-t border-[#20309A]/30 flex items-center justify-between text-xs">
                  <span className="text-[#F8F3F0]/70">Outline Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={styleConfig.outlineColor || "#000000"}
                      onChange={e => updateStyle("outlineColor", e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    />
                    <div className="flex gap-1.5">
                      {["#000000", "#FFFFFF", "#F8F3F0", "#BB232B", "#20309A", "#FFD400", "#00F0FF"].map(c => (
                        <button
                          key={c}
                          onClick={() => updateStyle("outlineColor", c)}
                          className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                            styleConfig.outlineColor?.toLowerCase() === c.toLowerCase()
                              ? "ring-2 ring-[#BB232B] scale-110 border-white"
                              : "border-neutral-700"
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Background Box Mode */}
            <div className="p-3 bg-[#060919] rounded-xl border border-[#20309A]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#F8F3F0]/80">
                  Background Box Style
                </label>
                <span className="text-[10px] text-[#F8F3F0]/60 font-mono capitalize">
                  {styleConfig.boxMode || "None"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: "none", label: "None" },
                  { id: "inline", label: "Pill Word" },
                  { id: "box", label: "Block" },
                  { id: "rounded", label: "Rounded" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setStyleConfig(prev => ({
                        ...prev,
                        boxMode: opt.id,
                        backgroundOpacity: opt.id !== "none" && (!prev.backgroundOpacity || prev.backgroundOpacity === 0) ? 0.85 : prev.backgroundOpacity
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      styleConfig.boxMode === opt.id
                        ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold border-[#20309A] shadow-md shadow-[#20309A]/30"
                        : "bg-[#0a0f2b] text-[#F8F3F0]/60 border-[#20309A]/30 hover:text-[#F8F3F0]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {styleConfig.boxMode !== "none" && (
                <div className="space-y-2 pt-2 border-t border-[#20309A]/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F8F3F0]/70">Box Color:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styleConfig.backgroundColor || "#000000"}
                        onChange={e => updateStyle("backgroundColor", e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <div className="flex gap-1.5">
                        {["#000000", "#20309A", "#BB232B", "#F8F3F0", "#FFE600", "#10B981"].map(c => (
                          <button
                            key={c}
                            onClick={() => updateStyle("backgroundColor", c)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              styleConfig.backgroundColor?.toLowerCase() === c.toLowerCase()
                                ? "ring-2 ring-[#BB232B] scale-110 border-white"
                                : "border-neutral-700"
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F8F3F0]/70">
                      Opacity: {Math.round((styleConfig.backgroundOpacity ?? 0.85) * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={styleConfig.backgroundOpacity ?? 0.85}
                      onChange={e => updateStyle("backgroundOpacity", parseFloat(e.target.value))}
                      className="w-36 accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Shadow & Negative Cutout Effect Toggle */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#060919] border border-[#20309A]/40 cursor-pointer hover:border-[#20309A] transition-all">
                <input
                  type="checkbox"
                  checked={styleConfig.shadow}
                  onChange={e => updateStyle("shadow", e.target.checked)}
                  className="accent-[#BB232B] w-4 h-4 rounded"
                />
                <span className="text-[#F8F3F0]/80 font-medium">Text Drop Shadow</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#060919] border border-[#20309A]/40 cursor-pointer hover:border-[#20309A] transition-all">
                <input
                  type="checkbox"
                  checked={styleConfig.textEffect === "negative"}
                  onChange={e => updateStyle("textEffect", e.target.checked ? "negative" : "none")}
                  className="accent-[#BB232B] w-4 h-4 rounded"
                />
                <span className="text-[#F8F3F0]/80 font-medium">Negative Cutout</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: POSITION & LAYOUT */}
        {activeTab === "position" && (
          <div className="space-y-4">
            {/* Vertical Position Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-[#F8F3F0]/80">Vertical Position (% from top)</span>
                <span className="font-mono text-[#BB232B] font-bold">{styleConfig.positionYPct}%</span>
              </div>
              <input
                type="range"
                min="18"
                max="82"
                step="1"
                value={styleConfig.positionYPct}
                onChange={e => updateStyle("positionYPct", parseInt(e.target.value))}
                className="w-full accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#F8F3F0]/50 font-mono mt-1">
                <span>Top (20%)</span>
                <span>Center (50%)</span>
                <span>Bottom Safe Zone (65%)</span>
              </div>
            </div>

            {/* Max Width % */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-[#F8F3F0]/80">Max Subtitle Width</span>
                <span className="font-mono text-[#BB232B] font-bold">{styleConfig.maxWidthPct}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="2"
                value={styleConfig.maxWidthPct}
                onChange={e => updateStyle("maxWidthPct", parseInt(e.target.value))}
                className="w-full accent-[#BB232B] bg-[#0c133b] h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Animation Entry Mode */}
            <div>
              <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                Word Animation
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: "pop", label: "Pop Scale" },
                  { id: "fade", label: "Smooth Fade" },
                  { id: "shamani", label: "Shamani Bounce" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => updateStyle("animation", opt.id)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      styleConfig.animation === opt.id
                        ? "bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold border-[#20309A] shadow-md shadow-[#20309A]/30"
                        : "bg-[#060919] text-[#F8F3F0]/70 border-[#20309A]/30 hover:bg-[#0a0f2b]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

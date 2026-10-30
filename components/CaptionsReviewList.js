"use client";

import React, { useState, useRef, useEffect } from "react";
import { Edit2, Check, X, Sparkles, Languages } from "lucide-react";
import { teluguToRomanized } from "@/lib/transliterate";

export default function CaptionsReviewList({
  segments = [],
  setSegments = () => {},
  currentTime = 0,
  onSeek = () => {},
  scriptMode = "romanized",
  setScriptMode = () => {},
  isPlaying = false
}) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const activeLineRef = useRef(null);

  // Auto-scroll active caption into view during playback
  useEffect(() => {
    if (isPlaying && activeLineRef.current && !editingId) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [currentTime, isPlaying, editingId]);

  const formatShortTime = (sec = 0) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const startEdit = (seg) => {
    setEditingId(seg.id);
    const currentVal = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
    setEditText(currentVal || "");
  };

  const saveEdit = (segId) => {
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }
    setSegments(prev =>
      prev.map(s => {
        if (s.id !== segId) return s;
        const isRo = scriptMode === "romanized";
        const nextTe = isRo ? (s.text || editText.trim()) : editText.trim();
        const nextRo = isRo ? editText.trim() : (teluguToRomanized(editText.trim()) || s.romanizedText);
        
        // Update words as well
        const wordsArr = (isRo ? nextRo : nextTe).split(/\s+/).filter(Boolean);
        const segDur = Math.max(0.1, (s.end || 2) - (s.start || 0));
        const wDur = segDur / Math.max(1, wordsArr.length);
        const updatedWords = wordsArr.map((w, idx) => ({
          word: isRo ? (s.words?.[idx]?.word || w) : w,
          romanized: isRo ? w : teluguToRomanized(w),
          start: Number(((s.start || 0) + idx * wDur).toFixed(2)),
          end: Number(((s.start || 0) + (idx + 1) * wDur).toFixed(2))
        }));

        return {
          ...s,
          text: nextTe,
          romanizedText: nextRo,
          words: updatedWords
        };
      })
    );
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#12131A] rounded-xl border border-[#232634] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[#232634] flex items-center justify-between shrink-0 bg-[#0F1016]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-[#FFFFFF] uppercase">
            Captions
          </span>
          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                const nextMode = scriptMode === "romanized" ? "telugu" : scriptMode === "telugu" ? "both" : "romanized";
                setScriptMode(nextMode);
              }}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1B1D28] text-[#E5C583] border border-[#E5C583]/40 hover:bg-[#E5C583]/10 transition-all cursor-pointer flex items-center gap-1"
              title="Click to toggle: Tanglish / Native Telugu / Both"
            >
              <span>{scriptMode === "romanized" ? "Tanglish" : scriptMode === "telugu" ? "తెలుగు" : "Both (తె+Eng)"}</span>
            </button>
          </div>
        </div>

        <span className="text-[10px] text-[#8A8E9F] font-medium">
          {segments.length} lines
        </span>
      </div>

      <div className="px-4 py-2 border-b border-[#232634]/60 bg-[#12131A] shrink-0">
        <span className="text-[11px] text-[#8A8E9F] font-medium">
          Review captions
        </span>
      </div>

      {/* Captions List */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#1D202C] scrollbar-thin scrollbar-thumb-[#252838]">
        {segments.map((seg, idx) => {
          const isActive = currentTime >= seg.start && currentTime <= seg.end;
          const isEditing = editingId === seg.id;
          const displayTxt = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;

          return (
            <div
              key={seg.id || idx}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek(seg.start)}
              className={`px-3.5 py-2.5 flex items-start gap-2.5 cursor-pointer transition-all duration-100 group ${
                isActive
                  ? "bg-[#1E202D] border-l-2 border-[#E5C583]"
                  : "hover:bg-[#161822]"
              }`}
            >
              {/* Timecode Badge */}
              <span className="font-mono text-[11px] text-[#8A8E9F] shrink-0 mt-0.5 select-none w-8">
                {formatShortTime(seg.start)}
              </span>

              {/* Caption Text or Inline Input */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveEdit(seg.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full px-2 py-1 bg-[#0D0E14] border border-[#E5C583] rounded text-[#FFFFFF] text-xs font-medium focus:outline-none"
                    />
                    <button
                      onClick={() => saveEdit(seg.id)}
                      className="p-1 rounded bg-[#E5C583] text-black hover:bg-[#F3E8CE] transition-all cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 rounded bg-[#252838] text-[#8A8E9F] hover:text-white transition-all cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p
                    className={`text-xs font-medium truncate ${
                      isActive ? "text-[#FFFFFF] font-semibold" : "text-[#D6D8E2]"
                    }`}
                  >
                    {displayTxt || <span className="italic text-[#6B7082]">Empty subtitle</span>}
                  </p>
                )}
              </div>

              {/* Hover Edit Pencil */}
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(seg);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8A8E9F] hover:text-[#E5C583] transition-all cursor-pointer shrink-0"
                  title="Edit text"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {segments.length === 0 && (
          <div className="py-12 text-center text-[#8A8E9F] text-xs">
            No captions detected yet.
          </div>
        )}
      </div>
    </div>
  );
}


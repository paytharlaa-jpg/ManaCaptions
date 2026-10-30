"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Scissors,
  Merge,
  Plus,
  Trash2,
  Clock,
  Languages,
  Sparkles,
  Play,
  Wand2,
  Loader2,
  Check,
  Mic
} from "lucide-react";
import { teluguToRomanized } from "@/lib/transliterate";
import { chunkSegmentsToFourFiveWords, chunkSegmentsToSingleWord } from "@/lib/captionPacing";
import CreditCostModal from "@/components/CreditCostModal";
import GuestAuthModal from "@/components/GuestAuthModal";
import { PRICING_RULES } from "@/config/pricing";
import { useAuth } from "@/lib/authContext";

export default function TranscriptEditor({
  segments,
  setSegments,
  currentTime,
  onSeek,
  scriptMode,
  setScriptMode,
  isTranscribing = false,
  asrInfo = null,
  onRetranscribe,
  isPlaying = false,
  selectedLanguage = "auto",
  setSelectedLanguage = () => {}
}) {
  const activeCardRef = useRef(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiToast, setAiToast] = useState(null);
  const [editingWord, setEditingWord] = useState(null); // { segId, wordIdx, val }

  // Auto-scroll active segment into view ONLY when video is actively playing and user is not typing
  useEffect(() => {
    const isEditing = typeof document !== "undefined" && document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");
    if (isPlaying && !isEditing && activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [currentTime, isPlaying]);

  const { user, updateCreditsBalance } = useAuth();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState(null);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);

  // AI Actions: Auto-Emoji, Grammar Polish & Translate
  const handleAiAction = (actionType) => {
    if (actionType === "translate_telugu") {
      if (!user) {
        setGuestAuthOpen(true);
        return;
      }
      const maxEnd = (segments || []).reduce((max, s) => Math.max(max, s.end || 0), 0);
      const cost = PRICING_RULES.calculateTranslationCost(maxEnd, 1);
      setPendingAiAction({
        actionType,
        cost,
        durationSec: Math.ceil(maxEnd || 30)
      });
      setCostModalOpen(true);
      return;
    }
    executeAiAction(actionType);
  };

  const executeAiAction = async (actionType) => {
    setCostModalOpen(false);
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, segments, scriptMode })
      });
      const data = await res.json();
      if (data.ok && data.segments) {
        setSegments(data.segments);
        if (actionType === "translate_telugu") {
          if (setScriptMode) setScriptMode("telugu");
          setAiToast("🇮🇳 Converted to Telugu Script!");
        } else if (actionType === "auto_emoji") {
          setAiToast("✨ Viral emojis added!");
        } else {
          setAiToast("🪄 Spellings & typos fixed!");
        }

        if (data.creditsRemaining !== undefined && updateCreditsBalance) {
          updateCreditsBalance(data.creditsRemaining);
        }

        setTimeout(() => setAiToast(null), 3000);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("AI action error:", err);
    } finally {
      setIsAiLoading(false);
      setPendingAiAction(null);
    }
  };

  // Global timing calibration: nudge all subtitle and word timestamps earlier or later
  const nudgeTiming = (offsetSec) => {
    setSegments(prev =>
      prev.map(seg => {
        const newStart = Math.max(0, Number(((seg.start || 0) + offsetSec).toFixed(2)));
        const newEnd = Math.max(newStart + 0.2, Number(((seg.end || 2) + offsetSec).toFixed(2)));
        const newWords = (seg.words || []).map(w => ({
          ...w,
          start: Math.max(0, Number(((w.start ?? seg.start) + offsetSec).toFixed(2))),
          end: Math.max(0.1, Number(((w.end ?? seg.end) + offsetSec).toFixed(2)))
        }));
        return {
          ...seg,
          start: newStart,
          end: newEnd,
          words: newWords
        };
      })
    );
    setAiToast(offsetSec < 0 ? `⚡ Sync: shifted ${offsetSec}s earlier` : `⏱️ Sync: shifted +${offsetSec}s later`);
    setTimeout(() => setAiToast(null), 2500);
  };

  // Pacing: Re-chunk segments into strictly 4-5 words per single-line frame
  const handleFormatFourFiveWords = () => {
    const formatted = chunkSegmentsToFourFiveWords(segments);
    setSegments(formatted);
    setAiToast("⚡ Pacing: 4-5 Words / 1-Line Frame!");
    setTimeout(() => setAiToast(null), 3000);
  };

  // Pacing: Re-chunk segments into 1-word rapid pop mode (MrBeast / Hormozi)
  const handleFormatSingleWord = () => {
    const formatted = chunkSegmentsToSingleWord(segments);
    setSegments(formatted);
    setAiToast("🔥 Pacing: 1-Word Pop Mode!");
    setTimeout(() => setAiToast(null), 3000);
  };

  // Update segment text with reactive sync to video and word chips (no seek interference)
  const updateSegmentText = (id, newText, isRomanized = false) => {
    // Auto-switch script mode to match the field being edited
    if (setScriptMode) {
      if (isRomanized && scriptMode !== "romanized") {
        setScriptMode("romanized");
      } else if (!isRomanized && scriptMode !== "telugu") {
        setScriptMode("telugu");
      }
    }

    // Update state with synchronized text, romanized translation, and word chips
    setSegments(prev =>
      prev.map(seg => {
        if (seg.id !== id) return seg;

        const nextTelugu = isRomanized ? (seg.text || "") : newText;
        const nextRomanized = isRomanized
          ? newText
          : (teluguToRomanized(newText) || seg.romanizedText || "");

        // Compute words dynamically so word chips and karaoke are always in sync
        const activeScriptText = isRomanized ? nextRomanized : nextTelugu;
        const textWords = (activeScriptText || "").trim().split(/\s+/).filter(Boolean);
        const segDuration = Math.max(0.1, (seg.end || 2) - (seg.start || 0));
        const wordDur = segDuration / Math.max(1, textWords.length);

        const updatedWords = textWords.map((w, idx) => ({
          word: isRomanized ? (seg.words?.[idx]?.word || w) : w,
          romanized: isRomanized ? w : teluguToRomanized(w),
          start: Number((seg.start + idx * wordDur).toFixed(2)),
          end: Number((seg.start + (idx + 1) * wordDur).toFixed(2))
        }));

        return {
          ...seg,
          text: nextTelugu,
          romanizedText: nextRomanized,
          words: updatedWords
        };
      })
    );
  };

  // Update segment timestamp and re-scale word timings
  const updateSegmentTime = (id, field, value) => {
    const num = value === "" ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    setSegments(prev =>
      prev.map(seg => {
        if (seg.id !== id) return seg;
        const updated = { ...seg, [field]: num };
        if (updated.words && updated.words.length > 0) {
          const segDuration = Math.max(0.1, updated.end - updated.start);
          const wordDur = segDuration / updated.words.length;
          updated.words = updated.words.map((w, idx) => ({
            ...w,
            start: Number((updated.start + idx * wordDur).toFixed(2)),
            end: Number((updated.start + (idx + 1) * wordDur).toFixed(2))
          }));
        }
        return updated;
      })
    );
  };

  // Convert script for a single segment
  const autoConvertScript = (id) => {
    setSegments(prev =>
      prev.map(seg => {
        if (seg.id !== id) return seg;
        return {
          ...seg,
          romanizedText: teluguToRomanized(seg.text)
        };
      })
    );
  };

  // Convert all segments to Romanized
  const convertAllToRomanized = () => {
    setSegments(prev =>
      prev.map(seg => ({
        ...seg,
        romanizedText: teluguToRomanized(seg.text)
      }))
    );
  };

  // Split Segment
  const splitSegment = (id) => {
    const idx = segments.findIndex(s => s.id === id);
    if (idx === -1) return;
    const seg = segments[idx];
    const textWords = seg.text.split(" ").filter(Boolean);
    if (textWords.length < 2) return;

    const mid = Math.floor(textWords.length / 2);
    const leftText = textWords.slice(0, mid).join(" ");
    const rightText = textWords.slice(mid).join(" ");
    const midTime = Number(((seg.start + seg.end) / 2).toFixed(2));

    const leftSeg = {
      ...seg,
      id: `seg-${Date.now()}-1`,
      text: leftText,
      romanizedText: teluguToRomanized(leftText),
      end: midTime,
      words: seg.words?.slice(0, mid)
    };

    const rightSeg = {
      id: `seg-${Date.now()}-2`,
      start: midTime,
      end: seg.end,
      text: rightText,
      romanizedText: teluguToRomanized(rightText),
      words: seg.words?.slice(mid)
    };

    const updated = [...segments];
    updated.splice(idx, 1, leftSeg, rightSeg);
    setSegments(updated);
  };

  // Merge with next segment
  const mergeWithNext = (idx) => {
    if (idx >= segments.length - 1) return;
    const cur = segments[idx];
    const next = segments[idx + 1];

    const merged = {
      id: cur.id,
      start: cur.start,
      end: next.end,
      text: `${cur.text.trim()} ${next.text.trim()}`,
      romanizedText: `${(cur.romanizedText || '').trim()} ${(next.romanizedText || '').trim()}`,
      words: [...(cur.words || []), ...(next.words || [])]
    };

    const updated = [...segments];
    updated.splice(idx, 2, merged);
    setSegments(updated);
  };

  // Add new 2s segment
  const addSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const start = lastSeg ? lastSeg.end + 0.1 : 0;
    const end = start + 2.5;

    const newSeg = {
      id: `seg-${Date.now()}`,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text: "కొత్త వాక్యం రాయండి",
      romanizedText: "Kotha vakyam rayandi",
      words: [
        { word: "కొత్త", romanized: "Kotha", start: start, end: start + 0.8 },
        { word: "వాక్యం", romanized: "vakyam", start: start + 0.8, end: start + 1.6 },
        { word: "రాయండి", romanized: "rayandi", start: start + 1.6, end: end }
      ]
    };
    setSegments([...segments, newSeg]);
  };

  // Delete segment with complete freedom (if last line, reset to a fresh empty line)
  const deleteSegment = (id) => {
    setSegments(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        return [
          {
            id: `seg-${Date.now()}`,
            start: 0,
            end: 2.5,
            text: "",
            romanizedText: "",
            words: []
          }
        ];
      }
      return remaining;
    });
  };

  // Clear all segments at once
  const clearAllSegments = () => {
    setSegments([
      {
        id: `seg-${Date.now()}`,
        start: 0,
        end: 2.5,
        text: "",
        romanizedText: "",
        words: []
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f26]/85 backdrop-blur-xl rounded-2xl border border-[#20309A]/40 p-3 sm:p-4 shadow-2xl shadow-[#20309A]/15 overflow-hidden min-h-0 relative">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#20309A]/25 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-[#F8F3F0] flex items-center gap-2">
            <span>Transcript Segments</span>
            <span className="text-[11px] font-mono bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 px-2.5 py-0.5 rounded-full font-bold shadow-sm shadow-[#BB232B]/20">
              {segments.length} lines
            </span>
            {asrInfo && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  asrInfo.activeEngine === "gemini" || asrInfo.activeEngine === "groq" || asrInfo.activeEngine === "sarvam"
                    ? "bg-[#20309A]/25 text-[#F8F3F0] border-[#20309A]/50 shadow-sm shadow-[#20309A]/30"
                    : "bg-[#060919] text-[#F8F3F0]/60 border-[#20309A]/30"
                }`}
                title={asrInfo.engineName}
              >
                {asrInfo.activeEngine === "gemini"
                  ? "✨ Gemini 2.5 Flash"
                  : asrInfo.activeEngine === "groq"
                  ? "⚡ Groq Whisper v3"
                  : asrInfo.activeEngine === "sarvam"
                  ? "🇮🇳 Sarvam AI"
                  : "⚡ Offline Engine"}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-[#F8F3F0]/60 mt-0.5">
            Click segment to seek. Edit Telugu or Romanized scripts.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearAllSegments}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-[#060919] hover:bg-[#BB232B]/20 text-[#F8F3F0]/60 hover:text-[#F8F3F0] border border-[#20309A]/30 hover:border-[#BB232B]/40 font-medium transition-all cursor-pointer"
            title="Clear all captions and start fresh"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#BB232B]" />
            <span className="hidden sm:inline">Clear All</span>
          </button>

          <button
            type="button"
            onClick={convertAllToRomanized}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-[#060919] hover:bg-[#20309A]/30 text-[#F8F3F0] border border-[#20309A]/40 font-medium transition-all cursor-pointer"
            title="Auto-generate Romanized script for all lines"
          >
            <Languages className="w-3.5 h-3.5 text-[#2e44d4]" />
            <span className="hidden sm:inline">Sync Romanized</span>
          </button>

          <button
            type="button"
            onClick={addSegment}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-gradient-to-r from-[#20309A] to-[#2d42cc] hover:from-[#2a3ecc] hover:to-[#3b51e6] text-[#F8F3F0] font-bold shadow-md shadow-[#20309A]/40 border border-[#20309A] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line</span>
          </button>
        </div>
      </div>

      {/* Pacing & Formatting Quick Bar (Strict 4-5 Words / 1-Line per frame) */}
      <div className="mb-2 px-2.5 py-1.5 bg-[#060919] border border-[#20309A]/40 rounded-xl flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#F8F3F0]/60 text-[11px] font-semibold">Pacing:</span>
          <button
            type="button"
            onClick={handleFormatFourFiveWords}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-gradient-to-r from-[#20309A] to-[#2d42cc] hover:from-[#2a3ecc] hover:to-[#3b51e6] text-[#F8F3F0] font-bold shadow-md shadow-[#20309A]/30 border border-[#20309A] transition-all cursor-pointer"
            title="Auto-format captions to 4-5 words strictly in 1 single line per frame"
          >
            <Sparkles className="w-3 h-3 text-[#FFE600]" />
            <span>⚡ 4-5 Words / 1-Line (Reel Standard)</span>
          </button>

          <button
            type="button"
            onClick={handleFormatSingleWord}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg bg-[#0a0f2b] hover:bg-[#20309A]/30 text-[#F8F3F0] border border-[#20309A]/40 font-medium transition-all cursor-pointer"
            title="Format each word into an individual rapid pop"
          >
            <span>🔥 1-Word Pop</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[#F8F3F0]/50 text-[11px]">Sync:</span>
          <button
            type="button"
            onClick={() => nudgeTiming(-0.1)}
            className="px-2 py-0.5 text-[10px] rounded bg-[#0a0f2b] hover:bg-[#20309A]/40 text-[#F8F3F0] font-mono border border-[#20309A]/30 cursor-pointer"
            title="Shift captions 0.1s earlier"
          >
            -0.1s
          </button>
          <button
            type="button"
            onClick={() => nudgeTiming(0.1)}
            className="px-2 py-0.5 text-[10px] rounded bg-[#0a0f2b] hover:bg-[#20309A]/40 text-[#F8F3F0] font-mono border border-[#20309A]/30 cursor-pointer"
            title="Shift captions 0.1s later"
          >
            +0.1s
          </button>
        </div>
      </div>

      {/* AI Intelligence Toolbar */}
      <div className="my-1.5 p-2 bg-gradient-to-r from-[#20309A]/25 via-[#BB232B]/15 to-[#060919]/60 border border-[#20309A]/40 rounded-xl flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-[#F8F3F0] animate-pulse" />
          <span className="text-xs font-bold text-[#F8F3F0]">AI Tools:</span>
          {aiToast && (
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {aiToast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onRetranscribe && (
            <div className="flex items-center gap-1 bg-[#060919] border border-[#20309A]/40 rounded-lg p-0.5">
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSelectedLanguage(newLang);
                  onRetranscribe(newLang);
                }}
                disabled={isTranscribing}
                className="bg-transparent text-[#F8F3F0] text-[11px] px-1.5 py-0.5 font-medium cursor-pointer focus:outline-none"
                title="Select language for speech recognition"
              >
                <option value="auto" className="bg-[#060919] text-[#F8F3F0]">🌐 Auto</option>
                <option value="te" className="bg-[#060919] text-[#F8F3F0]">🇮🇳 Telugu</option>
                <option value="en" className="bg-[#060919] text-[#F8F3F0]">🔤 English</option>
              </select>
              <button
                onClick={() => onRetranscribe(selectedLanguage)}
                disabled={isTranscribing}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-[#0a0f2b] hover:bg-[#20309A]/30 text-[#F8F3F0] transition-all cursor-pointer disabled:opacity-50"
                title="Re-run AI speech recognition with chosen language"
              >
                {isTranscribing ? <Loader2 className="w-3 h-3 animate-spin text-[#BB232B]" /> : <Mic className="w-3 h-3 text-[#2e44d4]" />}
                <span>{isTranscribing ? "Transcribing..." : "Re-Transcribe"}</span>
              </button>
            </div>
          )}

          <button
            onClick={() => handleAiAction("translate_telugu")}
            disabled={isAiLoading || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#20309A]/30 hover:bg-[#20309A]/50 text-[#F8F3F0] border border-[#20309A]/60 shadow-sm shadow-[#20309A]/30 transition-all cursor-pointer disabled:opacity-50"
            title="Convert and translate all captions into authentic Telugu script (తెలుగు లిపి)"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3 text-[#F8F3F0]" />}
            <span>🇮🇳 To Telugu</span>
          </button>

          <button
            onClick={() => handleAiAction("auto_emoji")}
            disabled={isAiLoading || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#060919] hover:bg-[#20309A]/30 text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer disabled:opacity-50"
            title="Scan viral trigger keywords and auto-inject matching emojis (🔥, 💰, 🤫, 🤯, ⚡)"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#BB232B]" />}
            <span>Auto-Emoji</span>
          </button>

          {/* Audio-Video Timing Nudge */}
          <div className="flex items-center gap-1 bg-[#060919] border border-[#20309A]/40 rounded-lg px-2 py-0.5 text-xs text-[#F8F3F0]">
            <span className="text-[10px] font-semibold text-[#F8F3F0]/60">Sync:</span>
            <button
              type="button"
              onClick={() => nudgeTiming(-0.1)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#0a0f2b] hover:bg-[#20309A]/40 text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer"
              title="Shift all captions 0.1s earlier (if captions appear after speech)"
            >
              -0.1s
            </button>
            <button
              type="button"
              onClick={() => nudgeTiming(0.1)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#0a0f2b] hover:bg-[#20309A]/40 text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer"
              title="Shift all captions 0.1s later (if captions appear before speech)"
            >
              +0.1s
            </button>
          </div>

          <button
            onClick={() => handleAiAction("grammar_polish")}
            disabled={isAiLoading || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            title="Scan and automatically fix spelling mistakes, typos, and grammar in both Telugu & English without changing spoken words"
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> : <Sparkles className="w-3 h-3 text-emerald-400" />}
            <span>Fix Spelling</span>
          </button>
        </div>
      </div>

      {/* Live Transcription Loading Banner */}
      {isTranscribing && (
        <div className="p-3 mb-2.5 rounded-xl bg-gradient-to-r from-[#20309A]/30 to-[#BB232B]/20 border border-[#20309A]/50 text-[#F8F3F0] text-xs flex items-center justify-between animate-pulse shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#BB232B] shrink-0" />
            <span>Transcribing speech with ManaCaption AI... (Matching word timings)</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#20309A]/40 text-[#F8F3F0] font-bold border border-[#20309A] shrink-0">
            {asrInfo?.activeEngine || "Mana AI"}
          </span>
        </div>
      )}

      {/* High-Visibility Segment Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pt-1 pr-1">
        {/* Active AI Transcription Progress Indicator */}
        {isTranscribing && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#20309A]/25 via-[#BB232B]/20 to-[#20309A]/15 border border-[#20309A]/50 text-center flex flex-col items-center justify-center gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-[#F8F3F0] font-bold text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#BB232B] shrink-0" />
              <span>ManaCaption AI Transcribing Speech & Timestamps...</span>
            </div>
            <p className="text-xs text-[#F8F3F0]/70 max-w-sm">
              Generating timed Telugu & English dual-script captions with word sync. Almost ready...
            </p>
            <div className="w-48 h-1 bg-[#060919] rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-gradient-to-r from-[#20309A] via-[#3d56eb] to-[#BB232B] animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {segments.length === 0 && !isTranscribing && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-[#F8F3F0]/60">
            <p className="text-sm font-medium">No caption lines yet.</p>
            <button
              type="button"
              onClick={addSegment}
              className="mt-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] font-bold text-xs hover:from-[#2a3ecc] hover:to-[#3b51e6] shadow-md shadow-[#20309A]/30 border border-[#20309A] transition-all cursor-pointer"
            >
              + Add First Caption Line
            </button>
          </div>
        )}

        {segments.map((seg, idx) => {
          const isActive = currentTime >= seg.start && currentTime <= seg.end;

          return (
            <div
              key={seg.id}
              ref={isActive ? activeCardRef : null}
              className={`p-3 rounded-xl border transition-all duration-150 ${
                isActive
                  ? "bg-[#0d1640] border-[#20309A] ring-2 ring-[#20309A]/60 shadow-xl shadow-[#20309A]/25"
                  : "bg-[#060919]/70 border-[#20309A]/25 hover:border-[#20309A]/50 hover:bg-[#080d2b]/80"
              }`}
            >
              {/* Card Meta Row: Number, Timing, Tools */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                    isActive ? "bg-gradient-to-r from-[#20309A] to-[#2e44d4] text-[#F8F3F0] border border-[#20309A]" : "bg-[#0a0f2b] text-[#F8F3F0]/70 border border-[#20309A]/30"
                  }`}>
                    #{String(idx + 1).padStart(2, '0')}
                  </span>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#F8F3F0] bg-[#BB232B]/20 px-2 py-0.5 rounded-full border border-[#BB232B]/50 shadow-sm shadow-[#BB232B]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BB232B] animate-ping" />
                      Playing
                    </span>
                  ) : (
                    <button
                      onClick={() => onSeek(Number((seg.start + 0.05).toFixed(2)))}
                      className="text-[10px] text-[#F8F3F0]/60 hover:text-[#F8F3F0] flex items-center gap-0.5 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Seek</span>
                    </button>
                  )}
                </div>

                {/* Timestamps & Per-Line Sync Nudge */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  <Clock className="w-3 h-3 text-[#F8F3F0]/40" />
                  <button
                    type="button"
                    onClick={() => nudgeSegmentTime(seg.id, -0.1)}
                    className="px-1 py-0.5 text-[9px] font-bold rounded bg-[#060919] hover:bg-[#20309A]/40 text-[#F8F3F0]/70 hover:text-[#F8F3F0] border border-[#20309A]/30 transition-all cursor-pointer"
                    title="Nudge line 0.1s earlier"
                  >
                    -0.1s
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={seg.start}
                    onChange={e => updateSegmentTime(seg.id, "start", e.target.value)}
                    className="w-13 px-1 py-0.5 bg-[#060919] border border-[#20309A]/40 rounded text-center text-[#F8F3F0] text-xs font-semibold focus:border-[#20309A] focus:outline-none"
                    title="Start time"
                  />
                  <span className="text-[#F8F3F0]/40">→</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={seg.end}
                    onChange={e => updateSegmentTime(seg.id, "end", e.target.value)}
                    className="w-13 px-1 py-0.5 bg-[#060919] border border-[#20309A]/40 rounded text-center text-[#F8F3F0] text-xs font-semibold focus:border-[#20309A] focus:outline-none"
                    title="End time"
                  />
                  <button
                    type="button"
                    onClick={() => nudgeSegmentTime(seg.id, 0.1)}
                    className="px-1 py-0.5 text-[9px] font-bold rounded bg-[#060919] hover:bg-[#20309A]/40 text-[#F8F3F0]/70 hover:text-[#F8F3F0] border border-[#20309A]/30 transition-all cursor-pointer"
                    title="Nudge line 0.1s later"
                  >
                    +0.1s
                  </button>
                  <span className="text-[10px] text-[#F8F3F0]/50 font-mono ml-0.5">
                    ({(seg.end - seg.start).toFixed(1)}s)
                  </span>
                </div>

                {/* Split, Merge, Delete Actions */}
                <div className="flex items-center gap-1">
                  {currentTime > (seg.start + 0.1) && currentTime < (seg.end - 0.1) ? (
                    <button
                      onClick={() => splitSegmentAtPlayhead(seg.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-[#BB232B] to-[#d82a34] text-[#F8F3F0] hover:scale-105 border border-[#BB232B] text-[10px] font-bold cursor-pointer transition-all shadow-md shadow-[#BB232B]/30"
                      title={`Split at current playhead (${currentTime.toFixed(2)}s)`}
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Split @ {currentTime.toFixed(1)}s</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => splitSegment(seg.id)}
                      className="p-1 rounded hover:bg-[#20309A]/20 text-[#F8F3F0]/60 hover:text-[#F8F3F0] cursor-pointer"
                      title="Split line at midpoint"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {idx < segments.length - 1 && (
                    <button
                      onClick={() => mergeWithNext(idx)}
                      className="p-1 rounded hover:bg-[#20309A]/20 text-[#F8F3F0]/60 hover:text-[#F8F3F0] cursor-pointer"
                      title="Merge with next line"
                    >
                      <Merge className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteSegment(seg.id)}
                    className="p-1 rounded hover:bg-[#BB232B]/30 text-[#F8F3F0]/60 hover:text-[#BB232B] cursor-pointer transition-colors"
                    title="Delete line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-1.5">
                {/* Native Telugu Script */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#F8F3F0]/60 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#F8F3F0]">తెలుగు (Native Script)</span>
                      {scriptMode === "telugu" || scriptMode === "both" ? (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                          ● Live on Video
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setScriptMode?.("telugu");
                            onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                          }}
                          className="text-[10px] text-[#F8F3F0]/60 hover:text-[#2e44d4] underline cursor-pointer"
                        >
                          Show on Video
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => autoConvertScript(seg.id)}
                      className="text-[10px] text-[#2e44d4] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-[#BB232B]" />
                      Sync Romanized
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={seg.text || ""}
                      onFocus={() => {
                        onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                        setScriptMode?.("telugu");
                      }}
                      onChange={e => updateSegmentText(seg.id, e.target.value, false)}
                      className="w-full px-2.5 py-1.5 pr-7 bg-[#060919] border border-[#20309A]/40 rounded-lg text-[#F8F3F0] text-sm font-semibold focus:border-[#20309A] focus:outline-none transition-all font-sans"
                      placeholder="తెలుగు టెక్స్ట్ రాయండి..."
                    />
                    {seg.text && (
                      <button
                        type="button"
                        onClick={() => updateSegmentText(seg.id, "", false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F8F3F0]/40 hover:text-[#F8F3F0] p-0.5 rounded text-xs cursor-pointer"
                        title="Clear text"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Romanized English Script */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#F8F3F0]/60 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#F8F3F0]">Romanized (English)</span>
                      {scriptMode === "romanized" || scriptMode === "both" ? (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                          ● Live on Video
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setScriptMode?.("romanized");
                            onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                          }}
                          className="text-[10px] text-[#F8F3F0]/60 hover:text-[#2e44d4] underline cursor-pointer"
                        >
                          Show on Video
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={seg.romanizedText || ""}
                      onFocus={() => {
                        onSeek?.(Number((seg.start + 0.05).toFixed(2)));
                        setScriptMode?.("romanized");
                      }}
                      onChange={e => updateSegmentText(seg.id, e.target.value, true)}
                      className="w-full px-2.5 py-1 pr-7 bg-[#060919] border border-[#20309A]/40 rounded-lg text-[#F8F3F0] text-xs font-mono focus:border-[#20309A] focus:outline-none transition-all"
                      placeholder="Type Romanized spelling..."
                    />
                    {seg.romanizedText && (
                      <button
                        type="button"
                        onClick={() => updateSegmentText(seg.id, "", true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#F8F3F0]/40 hover:text-[#F8F3F0] p-0.5 rounded text-xs cursor-pointer"
                        title="Clear text"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Word Chips with Inline Editing */}
              {seg.words && seg.words.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-[#20309A]/30 flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] font-mono text-[#F8F3F0]/50 mr-0.5">Words (2x click to edit):</span>
                  {seg.words.map((w, wIdx) => {
                    const isWordActive = currentTime >= w.start && currentTime <= w.end;
                    const isEditingThisWord = editingWord?.segId === seg.id && editingWord?.wordIdx === wIdx;
                    const wordLabel = scriptMode === "romanized" ? (w.romanized || w.word) : w.word;

                    if (isEditingThisWord) {
                      return (
                        <input
                          key={wIdx}
                          autoFocus
                          type="text"
                          value={editingWord.val}
                          onChange={e => setEditingWord({ ...editingWord, val: e.target.value })}
                          onBlur={() => saveWordEdit(seg.id, wIdx, editingWord.val)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveWordEdit(seg.id, wIdx, editingWord.val);
                            if (e.key === "Escape") setEditingWord(null);
                          }}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-[#060919] border border-[#2e44d4] text-[#F8F3F0] font-semibold w-20 focus:outline-none shadow-sm"
                        />
                      );
                    }

                    return (
                      <button
                        key={wIdx}
                        onClick={() => onSeek(w.start)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingWord({ segId: seg.id, wordIdx: wIdx, val: wordLabel });
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                          isWordActive
                            ? "bg-gradient-to-r from-[#BB232B] to-[#d82a34] text-[#F8F3F0] font-bold shadow-md shadow-[#BB232B]/40 scale-105 border border-[#BB232B]"
                            : "bg-[#060919] text-[#F8F3F0]/70 hover:bg-[#20309A]/20 hover:text-[#F8F3F0] border border-[#20309A]/30"
                        }`}
                        title={`Click to seek (${w.start}s). Double-click to edit word.`}
                      >
                        {wordLabel}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Credit Pre-Confirmation Modal for Translation */}
      <CreditCostModal
        isOpen={costModalOpen}
        onClose={() => { setCostModalOpen(false); setPendingAiAction(null); }}
        onConfirm={() => executeAiAction(pendingAiAction?.actionType || "translate_telugu")}
        cost={pendingAiAction?.cost || 1}
        currentBalance={user?.credits_balance ?? 10}
        durationSec={pendingAiAction?.durationSec}
        actionTitle="Translate to Native Telugu"
        description="Converts transliterated text into authentic Native Telugu script."
      />

      {/* Guest Trial Sign In Modal */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType="translate"
        onSuccess={() => {
          executeAiAction("translate_telugu");
        }}
      />
    </div>
  );
}

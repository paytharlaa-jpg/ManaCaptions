"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Scissors,
  Merge,
  Plus,
  Trash2,
  Undo2,
  BookOpen,
  ZoomIn,
  ZoomOut
} from "lucide-react";

export default function MultiTrackTimeline({
  duration = 30,
  currentTime = 0,
  setCurrentTime = () => {},
  isPlaying = false,
  togglePlay = () => {},
  segments = [],
  setSegments = () => {},
  videoSrc = null,
  currentFile = null
}) {
  const containerRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1x to 3x zoom
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [history, setHistory] = useState([]);
  const [waveformData, setWaveformData] = useState(null);

  const effectiveDuration = duration > 0 ? duration : 30;
  // Calculate width in pixels based on zoom level (base ~30px per second)
  const pxPerSec = Math.max(25, 35 * zoomLevel);
  const totalTimelineWidth = Math.max(900, Math.ceil(effectiveDuration * pxPerSec));

  // Extract real audio waveform if available via Web Audio API
  useEffect(() => {
    let isCancelled = false;
    async function extractWaveform() {
      if (!currentFile && !videoSrc) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        
        let arrayBuffer = null;
        if (currentFile) {
          arrayBuffer = await currentFile.arrayBuffer();
        } else if (videoSrc) {
          const res = await fetch(videoSrc);
          arrayBuffer = await res.arrayBuffer();
        }

        if (arrayBuffer && !isCancelled) {
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const channelData = audioBuffer.getChannelData(0);
          const samples = 200;
          const blockSize = Math.floor(channelData.length / samples);
          const peaks = [];
          for (let i = 0; i < samples; i++) {
            let max = 0;
            for (let j = 0; j < blockSize; j++) {
              const val = Math.abs(channelData[i * blockSize + j]);
              if (val > max) max = val;
            }
            peaks.push(max);
          }
          if (!isCancelled) setWaveformData(peaks);
          audioCtx.close().catch(() => {});
        }
      } catch (err) {
        // Fallback to generated speech waveform
      }
    }
    extractWaveform();
    return () => { isCancelled = true; };
  }, [currentFile, videoSrc]);

  // Format time display 0:00.00 / 0:54
  const formatTimecode = (sec = 0) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  const formatSecOnly = (sec = 0) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // Timeline Scrub / Seek
  const handleTimelineClick = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, Math.min(effectiveDuration, clickX / pxPerSec));
    setCurrentTime(Number(newTime.toFixed(2)));
  };

  // Find active segment under current playhead
  const activeSegment = useMemo(() => {
    return segments.find(s => currentTime >= s.start && currentTime <= s.end) || null;
  }, [segments, currentTime]);

  // Save state to undo history
  const pushHistory = () => {
    setHistory(prev => [...prev.slice(-10), JSON.stringify(segments)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    try {
      setSegments(JSON.parse(prev));
    } catch {}
  };

  // Split at playhead
  const handleSplit = () => {
    const seg = activeSegment || segments.find(s => s.id === selectedSegId);
    if (!seg) return;
    const cutTime = Number(currentTime.toFixed(2));
    if (cutTime <= seg.start + 0.1 || cutTime >= seg.end - 0.1) return;

    pushHistory();
    const idx = segments.findIndex(s => s.id === seg.id);
    const words = seg.text.split(/\s+/).filter(Boolean);
    const ratio = (cutTime - seg.start) / Math.max(0.1, seg.end - seg.start);
    const splitIndex = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));

    const leftText = words.slice(0, splitIndex).join(" ");
    const rightText = words.slice(splitIndex).join(" ");

    const leftSeg = {
      ...seg,
      id: `seg-${Date.now()}-1`,
      start: seg.start,
      end: cutTime,
      text: leftText || seg.text
    };

    const rightSeg = {
      ...seg,
      id: `seg-${Date.now()}-2`,
      start: cutTime,
      end: seg.end,
      text: rightText || seg.text
    };

    const next = [...segments];
    next.splice(idx, 1, leftSeg, rightSeg);
    setSegments(next);
  };

  // Merge with next
  const handleMerge = () => {
    const curId = selectedSegId || activeSegment?.id;
    const idx = segments.findIndex(s => s.id === curId);
    if (idx === -1 || idx >= segments.length - 1) return;

    pushHistory();
    const cur = segments[idx];
    const next = segments[idx + 1];
    const merged = {
      ...cur,
      end: next.end,
      text: `${cur.text.trim()} ${next.text.trim()}`,
      romanizedText: `${cur.romanizedText || ""} ${next.romanizedText || ""}`.trim()
    };
    const updated = [...segments];
    updated.splice(idx, 2, merged);
    setSegments(updated);
  };

  // Delete segment
  const handleDelete = () => {
    const curId = selectedSegId || activeSegment?.id;
    if (!curId) return;
    pushHistory();
    setSegments(prev => prev.filter(s => s.id !== curId));
    setSelectedSegId(null);
  };

  // Add text block
  const handleAddText = () => {
    pushHistory();
    const start = Number(currentTime.toFixed(2));
    const end = Math.min(effectiveDuration, Number((start + 2.5).toFixed(2)));
    const newSeg = {
      id: `seg-${Date.now()}`,
      start,
      end,
      text: "కొత్త వాక్యం",
      romanizedText: "Kotha vakyam"
    };
    const updated = [...segments, newSeg].sort((a, b) => a.start - b.start);
    setSegments(updated);
    setSelectedSegId(newSeg.id);
  };

  // Playhead position in px
  const playheadLeftPx = currentTime * pxPerSec;

  // Time ruler ticks (every 2 seconds)
  const ticksCount = Math.ceil(effectiveDuration / 2) + 1;
  const timeTicks = Array.from({ length: ticksCount }, (_, i) => i * 2);

  return (
    <div className="w-full bg-[#0D0E14] border-t border-[#232634] flex flex-col select-none shrink-0 overflow-hidden shadow-2xl">
      {/* Top Toolbar Action Strip */}
      <div className="h-10 px-4 border-b border-[#232634] flex items-center justify-between bg-[#12131A] text-xs">
        {/* Left: Play button & Timecode */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#E5C583] transition-all cursor-pointer shadow-sm"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <span className="font-mono text-xs text-[#FFFFFF] font-semibold">
            {formatTimecode(currentTime)} <span className="text-[#6B7082]">/ {formatSecOnly(effectiveDuration)}</span>
          </span>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleAddText}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#D6D8E2] hover:text-white bg-[#1A1C27] hover:bg-[#252838] border border-[#2B2F42] transition-all cursor-pointer"
            title="Add text caption block"
          >
            <Plus className="w-3 h-3" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={handleSplit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#D6D8E2] hover:text-white bg-[#1A1C27] hover:bg-[#252838] border border-[#2B2F42] transition-all cursor-pointer"
            title="Split caption block at playhead"
          >
            <Scissors className="w-3 h-3" />
            <span>Split</span>
          </button>

          <button
            type="button"
            onClick={handleMerge}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#D6D8E2] hover:text-white bg-[#1A1C27] hover:bg-[#252838] border border-[#2B2F42] transition-all cursor-pointer"
            title="Merge with next caption block"
          >
            <Merge className="w-3 h-3" />
            <span>Merge</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-[#D6D8E2] hover:text-[#E0353E] bg-[#1A1C27] hover:bg-[#252838] border border-[#2B2F42] transition-all cursor-pointer"
            title="Delete selected caption block"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#D6D8E2] hover:text-white bg-[#1A1C27] hover:bg-[#252838] border border-[#2B2F42] transition-all cursor-pointer disabled:opacity-40"
            title="Undo"
          >
            <Undo2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[#D6D8E2] hover:text-white bg-[#1A1C27] hover:bg-[#252838] border border-[#2B2F42] transition-all cursor-pointer"
            title="Dictionary"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">Dictionary</span>
          </button>
        </div>

        {/* Right: Zoom slider */}
        <div className="flex items-center gap-1.5 text-[#8A8E9F]">
          <ZoomOut className="w-3 h-3" />
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={zoomLevel}
            onChange={e => setZoomLevel(parseFloat(e.target.value))}
            className="w-16 sm:w-20 h-1 bg-[#232634] rounded appearance-none cursor-pointer accent-[#E5C583]"
            title="Timeline zoom"
          />
          <ZoomIn className="w-3 h-3" />
        </div>
      </div>

      {/* Multi-Track Scrollable Timeline Canvas */}
      <div
        ref={containerRef}
        onClick={handleTimelineClick}
        className="w-full h-28 overflow-x-auto overflow-y-hidden relative bg-[#090A0E] cursor-pointer scrollbar-thin scrollbar-thumb-[#252838]"
      >
        <div
          className="relative h-full"
          style={{ width: `${totalTimelineWidth}px` }}
        >
          {/* Track 1: Time Ruler */}
          <div className="h-6 border-b border-[#1E202D] bg-[#0E0F15] relative flex items-center">
            {timeTicks.map(t => {
              const leftPx = t * pxPerSec;
              return (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 flex flex-col justify-between"
                  style={{ left: `${leftPx}px` }}
                >
                  <span className="text-[9px] font-mono text-[#6B7082] pl-1 select-none">
                    {formatSecOnly(t)}
                  </span>
                  <div className="w-px h-1.5 bg-[#2B2E40]" />
                </div>
              );
            })}
          </div>

          {/* Track 2: Caption Blocks */}
          <div className="h-10 border-b border-[#1A1B24] relative bg-[#0C0D12]">
            {segments.map(seg => {
              const startPx = seg.start * pxPerSec;
              const widthPx = Math.max(18, (seg.end - seg.start) * pxPerSec);
              const isActive = (currentTime >= seg.start && currentTime <= seg.end) || selectedSegId === seg.id;

              return (
                <div
                  key={seg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSegId(seg.id);
                    setCurrentTime(seg.start);
                  }}
                  className={`absolute top-1 bottom-1 rounded px-1.5 flex items-center overflow-hidden transition-all cursor-pointer border ${
                    isActive
                      ? "bg-[#1E2235] border-white text-white font-bold shadow-md ring-1 ring-white"
                      : "bg-[#161824] border-[#2A2E44] text-[#C4C7D7] hover:bg-[#1D2030]"
                  }`}
                  style={{
                    left: `${startPx}px`,
                    width: `${widthPx}px`
                  }}
                  title={seg.text}
                >
                  <span className="text-[10px] font-sans truncate select-none leading-none">
                    {seg.text || seg.romanizedText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Track 3: Audio Waveform Track (Golden Audio Speech Waves) */}
          <div className="h-12 relative bg-[#0A0B10] flex items-center overflow-hidden">
            {/* Real or Simulated Golden Waveform Bars */}
            <div className="w-full h-full flex items-center px-1 gap-[2px] opacity-85">
              {Array.from({ length: Math.ceil(totalTimelineWidth / 4) }).map((_, i) => {
                const sampleSec = (i * 4) / pxPerSec;
                // Check if speech segment covers this second
                const hasSpeech = segments.some(s => sampleSec >= s.start && sampleSec <= s.end);
                const heightPct = hasSpeech
                  ? Math.min(85, Math.max(20, Math.sin(i * 0.3) * 40 + Math.cos(i * 0.8) * 35 + 30))
                  : Math.max(8, Math.sin(i * 0.2) * 12 + 6);

                return (
                  <div
                    key={i}
                    className="w-[2px] rounded-full transition-all"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: hasSpeech ? "#E5C583" : "#303448"
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Vertical Playhead Cursor Line with Red Indicator */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white z-40 pointer-events-none transition-transform duration-75"
            style={{
              left: `${playheadLeftPx}px`,
              boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)"
            }}
          >
            {/* Playhead Head (Triangle/Handle) */}
            <div className="w-2.5 h-3 bg-white -ml-[4.5px] -mt-0.5 rounded-b-sm shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
}


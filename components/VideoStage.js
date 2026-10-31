"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Smartphone,
  Scissors,
  RotateCcw as ResetIcon,
  ChevronUp,
  ChevronDown,
  Layers
} from "lucide-react";
import CaptionOverlay from "./CaptionOverlay";
import InstagramSafeZone from "./InstagramSafeZone";

export default function VideoStage({
  videoSrc,
  segments,
  styleConfig,
  setStyleConfig,
  scriptMode,
  setScriptMode,
  showSafeZone,
  setShowSafeZone,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  isPlaying,
  setIsPlaying,
  trimRange = { start: 0, end: 0 },
  setTrimRange = () => {}
}) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState("9/16"); // '9/16' | '1/1' | '16/9'
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [fitMode, setFitMode] = useState("cover"); // 'cover' | 'contain'
  const [activeDragHandle, setActiveDragHandle] = useState(null); // 'in' | 'out' | null

  const effectiveDuration = duration > 0 ? duration : 1;
  const trimStart = Math.max(0, Math.min(trimRange?.start || 0, effectiveDuration));
  const trimEnd = (trimRange?.end && trimRange.end > 0) ? Math.min(effectiveDuration, Math.max(trimRange.end, trimStart + 0.2)) : effectiveDuration;
  const isTrimmed = trimStart > 0.05 || (trimEnd < effectiveDuration - 0.05);
  const trimmedDuration = Math.max(0.1, trimEnd - trimStart);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // If playhead is outside or at the end of trim range, jump to trimStart
      if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd - 0.05) {
        videoRef.current.currentTime = trimStart;
        setCurrentTime(trimStart);
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Keyboard Spacebar & In/Out shortcuts ('i' for Set In, 'o' for Set Out)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setInPoint();
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setOutPoint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentTime, trimEnd, trimStart, duration]);

  // Sync external seek requests to video element
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.15) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Real-time 60fps audio/video playhead sync with trim looping
  useEffect(() => {
    let animId;
    const syncLoop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        const cur = videoRef.current.currentTime;
        // Clamp and loop within trimmed range
        if (trimEnd > trimStart && cur >= trimEnd) {
          videoRef.current.currentTime = trimStart;
          setCurrentTime(trimStart);
        } else if (cur < trimStart) {
          videoRef.current.currentTime = trimStart;
          setCurrentTime(trimStart);
        } else {
          setCurrentTime(cur);
        }
        animId = requestAnimationFrame(syncLoop);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(syncLoop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, setCurrentTime, trimStart, trimEnd]);

  // Video time update fallback
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      if (trimEnd > trimStart && cur >= trimEnd && isPlaying) {
        videoRef.current.currentTime = trimStart;
        setCurrentTime(trimStart);
      } else {
        setCurrentTime(cur);
      }
    }
  };

  // Video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration || 1;
      setDuration(d);
      if (!trimRange?.end || trimRange.end === 0 || trimRange.end > d) {
        setTrimRange({ start: Math.min(trimRange?.start || 0, d), end: d });
      }
    }
  };

  // Seek bar scrub
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Set In point (trimStart) to current playhead
  const setInPoint = () => {
    const nextStart = Math.min(currentTime, trimEnd - 0.5);
    const validStart = Math.max(0, Number(nextStart.toFixed(2)));
    setTrimRange({ start: validStart, end: trimEnd });
  };

  // Set Out point (trimEnd) to current playhead
  const setOutPoint = () => {
    const nextEnd = Math.max(currentTime, trimStart + 0.5);
    const validEnd = Math.min(effectiveDuration, Number(nextEnd.toFixed(2)));
    setTrimRange({ start: trimStart, end: validEnd });
  };

  // Reset trim to full video duration
  const resetTrim = () => {
    setTrimRange({ start: 0, end: effectiveDuration });
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Update In Handle Slider
  const handleInSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    const validStart = Math.max(0, Math.min(val, trimEnd - 0.5));
    setTrimRange({ start: Number(validStart.toFixed(2)), end: trimEnd });
    if (videoRef.current) {
      videoRef.current.currentTime = validStart;
      setCurrentTime(validStart);
    }
  };

  // Update Out Handle Slider
  const handleOutSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    const validEnd = Math.min(effectiveDuration, Math.max(val, trimStart + 0.5));
    setTrimRange({ start: trimStart, end: Number(validEnd.toFixed(2)) });
    if (videoRef.current) {
      videoRef.current.currentTime = validEnd;
      setCurrentTime(validEnd);
    }
  };

  // Vertical position adjustment helper
  const adjustCaptionPosition = (delta) => {
    if (setStyleConfig) {
      setStyleConfig(prev => ({
        ...prev,
        positionYPct: Math.max(12, Math.min(88, Math.round((prev.positionYPct ?? 75) + delta)))
      }));
    }
  };

  const setPresetPosition = (pos) => {
    if (setStyleConfig) {
      const targetPct = pos === "top" ? 22 : pos === "center" ? 50 : 78;
      setStyleConfig(prev => ({ ...prev, positionYPct: targetPct }));
    }
  };

  // Skip relative
  const skipSeconds = (sec) => {
    if (videoRef.current) {
      const next = Math.max(trimStart, Math.min(trimEnd, videoRef.current.currentTime + sec));
      videoRef.current.currentTime = next;
      setCurrentTime(next);
    }
  };

  // Format seconds to mm:ss.d
  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  // Playback rate cycle
  const cycleRate = () => {
    const rates = [0.75, 1, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  // Positions in percent for timeline visual layers
  const trimStartPct = (trimStart / effectiveDuration) * 100;
  const trimEndPct = (trimEnd / effectiveDuration) * 100;
  const trimWidthPct = Math.max(1, trimEndPct - trimStartPct);
  const playheadPct = (currentTime / effectiveDuration) * 100;

  return (
    <div className="flex flex-col w-full h-full p-2.5 sm:p-3 bg-[#0a0f26]/85 backdrop-blur-xl rounded-2xl border border-[#20309A]/40 shadow-2xl shadow-[#20309A]/15 overflow-hidden min-h-0 relative">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between gap-2 px-1 pb-2 border-b border-[#20309A]/25 shrink-0">
        {/* Script Mode Selector */}
        <div className="flex items-center gap-1 bg-[#060919] p-0.5 rounded-lg border border-[#20309A]/40 text-xs">
          <button
            type="button"
            onClick={() => setScriptMode("both")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              scriptMode === "both"
                ? "bg-gradient-to-r from-[#20309A] to-[#2e44d4] text-[#F8F3F0] shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
            title="Show both Native Telugu script and English captions simultaneously"
          >
            Both (తెలుగు + Eng)
          </button>
          <button
            type="button"
            onClick={() => setScriptMode("telugu")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              scriptMode === "telugu"
                ? "bg-gradient-to-r from-[#20309A] to-[#2e44d4] text-[#F8F3F0] shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
            title="Show Native Telugu script (తెలుగు లిపి) captions"
          >
            తెలుగు (Native)
          </button>
          <button
            type="button"
            onClick={() => setScriptMode("romanized")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              scriptMode === "romanized"
                ? "bg-gradient-to-r from-[#20309A] to-[#2e44d4] text-[#F8F3F0] shadow-md shadow-[#20309A]/40 border border-[#20309A]"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
            }`}
            title="Show verbatim spoken English / Romanized captions"
          >
            English (Spoken)
          </button>
        </div>

        {/* Right Tools: Fit Mode, Safezone, Subtitle Position & Aspect Ratio */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Subtitle Vertical Placement Nudge */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#060919] p-0.5 rounded-lg border border-[#20309A]/30 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => adjustCaptionPosition(-4)}
              className="px-1.5 py-0.5 text-[#F8F3F0]/70 hover:text-[#F8F3F0] hover:bg-[#20309A]/30 rounded cursor-pointer transition-all"
              title="Shift caption position higher (Up)"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <span
              className="px-1 text-[10px] text-[#F8F3F0]/70 select-none cursor-pointer hover:text-[#F8F3F0]"
              title={`Vertical position: ${styleConfig?.positionYPct ?? 75}%. Click to reset to default 75%`}
              onClick={() => adjustCaptionPosition(0)}
            >
              Y:{styleConfig?.positionYPct ?? 75}%
            </span>
            <button
              type="button"
              onClick={() => adjustCaptionPosition(4)}
              className="px-1.5 py-0.5 text-[#F8F3F0]/70 hover:text-[#F8F3F0] hover:bg-[#20309A]/30 rounded cursor-pointer transition-all"
              title="Shift caption position lower (Down)"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Fit / Fill Toggle */}
          <button
            onClick={() => setFitMode(fitMode === "cover" ? "contain" : "cover")}
            title={fitMode === "cover" ? "Fill Frame (Cover) - Click to fit entire video" : "Fit Frame (Contain) - Click to fill frame"}
            className="px-2 py-1 rounded-lg border border-[#20309A]/40 bg-[#060919] text-[#F8F3F0]/70 hover:text-[#F8F3F0] text-xs font-medium cursor-pointer transition-all hover:border-[#20309A]"
          >
            {fitMode === "cover" ? "Fill" : "Fit"}
          </button>

          <button
            onClick={() => setShowSafeZone(!showSafeZone)}
            title="Toggle caption margin guidelines"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              showSafeZone
                ? "bg-[#BB232B]/20 text-[#F8F3F0] border-[#BB232B]/60 shadow-sm shadow-[#BB232B]/30"
                : "bg-[#060919] text-[#F8F3F0]/60 border-[#20309A]/30 hover:text-[#F8F3F0] hover:border-[#20309A]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#BB232B]" />
            <span className="hidden sm:inline">Guides</span>
          </button>

          <div className="flex items-center gap-0.5 bg-[#060919] p-0.5 rounded-lg border border-[#20309A]/30 text-[11px] font-mono">
            <button
              onClick={() => setAspectRatio("9/16")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                aspectRatio === "9/16" ? "bg-[#20309A] text-[#F8F3F0] font-bold shadow-sm" : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
              }`}
            >
              9:16
            </button>
            <button
              onClick={() => setAspectRatio("1/1")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                aspectRatio === "1/1" ? "bg-[#20309A] text-[#F8F3F0] font-bold shadow-sm" : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
              }`}
            >
              1:1
            </button>
            <button
              onClick={() => setAspectRatio("16/9")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                aspectRatio === "16/9" ? "bg-[#20309A] text-[#F8F3F0] font-bold shadow-sm" : "text-[#F8F3F0]/60 hover:text-[#F8F3F0]"
              }`}
            >
              16:9
            </button>
          </div>
        </div>
      </div>

      {/* Center Viewport Stage */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center p-2 overflow-hidden my-1 relative">
        <div
          className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#20309A]/40 ring-1 ring-[#20309A]/30 flex items-center justify-center cursor-pointer group select-none transition-all duration-150 [container-type:size]"
          style={{
            containerType: "size",
            aspectRatio: aspectRatio,
            maxHeight: "100%",
            maxWidth: "100%",
            ...(aspectRatio === "16/9"
              ? { width: "100%", height: "auto" }
              : { height: "100%", width: "auto" })
          }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className={`w-full h-full ${fitMode === "contain" ? "object-contain bg-black" : "object-cover"}`}
            playsInline
            loop={false}
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              if (trimEnd > trimStart) {
                if (videoRef.current) {
                  videoRef.current.currentTime = trimStart;
                  setCurrentTime(trimStart);
                  videoRef.current.play();
                }
              } else {
                setIsPlaying(false);
              }
            }}
          />

          {/* Live Subtitle Caption Overlay */}
          <CaptionOverlay
            segments={segments}
            currentTime={currentTime}
            styleConfig={styleConfig}
            scriptMode={scriptMode}
            isPlaying={isPlaying}
          />

          {/* Instagram Safe Zone Simulation */}
          <InstagramSafeZone
            enabled={showSafeZone && aspectRatio === "9/16"}
            stylePosY={styleConfig?.positionYPct ?? 75}
          />

          {/* Central Play/Pause indicator on pause */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-[#060919]/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none transition-all">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#20309A] to-[#BB232B] text-[#F8F3F0] flex items-center justify-center shadow-xl shadow-[#20309A]/50 border border-[#F8F3F0]/30 hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-[#F8F3F0] ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Timeline & Controls Bar */}
      <div className="w-full px-3 py-2 rounded-xl bg-[#060919]/90 border border-[#20309A]/40 flex flex-col gap-2 shrink-0 shadow-lg">
        {/* CapCut Visual Video Trimmer & Scrubber Toolbar */}
        <div className="flex items-center justify-between text-xs pb-1 border-b border-[#20309A]/20">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#20309A]/30 text-[#F8F3F0] border border-[#20309A]/50">
              <Scissors className="w-3 h-3 text-[#BB232B]" />
              <span>Trim: {formatTime(trimStart)} - {formatTime(trimEnd)}</span>
              <span className="text-[#BB232B] ml-1">({trimmedDuration.toFixed(1)}s)</span>
            </span>

            {isTrimmed && (
              <button
                type="button"
                onClick={resetTrim}
                className="flex items-center gap-1 text-[10px] text-[#F8F3F0]/60 hover:text-[#BB232B] transition-colors cursor-pointer"
                title="Reset trim to full video duration"
              >
                <ResetIcon className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={setInPoint}
              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#0a0f2b] hover:bg-[#20309A]/40 text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer"
              title="Set In Point at current playhead (Shortcut: I)"
            >
              [ Set In (I)
            </button>
            <button
              type="button"
              onClick={setOutPoint}
              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-[#0a0f2b] hover:bg-[#20309A]/40 text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer"
              title="Set Out Point at current playhead (Shortcut: O)"
            >
              Set Out (O) ]
            </button>
          </div>
        </div>

        {/* Dual-Handle Trimming Scrubber Stage */}
        <div className="relative w-full h-7 bg-[#080d2b] rounded-lg border border-[#20309A]/40 overflow-hidden flex items-center select-none" ref={timelineRef}>
          {/* Dimmed Outside Left Zone */}
          {trimStartPct > 0 && (
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/65 backdrop-blur-[1px] border-r-2 border-[#BB232B] z-10 pointer-events-none"
              style={{ width: `${trimStartPct}%` }}
            />
          )}

          {/* Dimmed Outside Right Zone */}
          {trimEndPct < 100 && (
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/65 backdrop-blur-[1px] border-l-2 border-[#BB232B] z-10 pointer-events-none"
              style={{ width: `${100 - trimEndPct}%` }}
            />
          )}

          {/* Active Trimmed Region Highlight Glow */}
          <div
            className="absolute top-0 bottom-0 bg-[#20309A]/20 border-y border-[#2e44d4]/60 pointer-events-none z-5"
            style={{
              left: `${trimStartPct}%`,
              width: `${trimWidthPct}%`
            }}
          />

          {/* Segment Tick Markers in Background */}
          {effectiveDuration > 0 && segments.map(seg => (
            <div
              key={seg.id}
              className="absolute h-full bg-[#20309A]/30 border-r border-[#BB232B]/50 pointer-events-none z-0"
              style={{
                left: `${(seg.start / effectiveDuration) * 100}%`,
                width: `${Math.max(1, ((seg.end - seg.start) / effectiveDuration) * 100)}%`
              }}
            />
          ))}

          {/* Primary Playhead Scrubber Range */}
          <input
            type="range"
            min="0"
            max={effectiveDuration}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            title="Seek Playhead"
          />

          {/* Red Playhead Line with Current Position */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-[#BB232B] shadow-md shadow-[#BB232B] z-25 pointer-events-none -translate-x-1/2 transition-all duration-75"
            style={{ left: `${playheadPct}%` }}
          >
            <div className="w-2.5 h-2.5 bg-[#BB232B] rounded-full -ml-[3px] -mt-0.5 shadow-sm shadow-black" />
          </div>

          {/* In Handle Grip (Left) */}
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-gradient-to-r from-[#BB232B] to-[#d82a34] rounded-l flex items-center justify-center z-20 pointer-events-none shadow-md shadow-black"
            style={{ left: `${trimStartPct}%`, transform: 'translateX(-100%)' }}
            title={`In Point: ${formatTime(trimStart)}`}
          >
            <div className="w-0.5 h-3 bg-white/90 rounded-full" />
          </div>

          {/* Out Handle Grip (Right) */}
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-gradient-to-r from-[#d82a34] to-[#BB232B] rounded-r flex items-center justify-center z-20 pointer-events-none shadow-md shadow-black"
            style={{ left: `${trimEndPct}%` }}
            title={`Out Point: ${formatTime(trimEnd)}`}
          >
            <div className="w-0.5 h-3 bg-white/90 rounded-full" />
          </div>
        </div>

        {/* Micro Handle Sliders for Precision In/Out Dragging */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#F8F3F0]/60 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[#BB232B] font-bold shrink-0">In [ :</span>
            <input
              type="range"
              min="0"
              max={effectiveDuration}
              step="0.1"
              value={trimStart}
              onChange={handleInSliderChange}
              className="w-full h-1 bg-[#0a0f2b] rounded appearance-none cursor-pointer accent-[#BB232B]"
              title="Slide to adjust video start cut"
            />
            <span className="shrink-0 text-[#F8F3F0] font-semibold">{formatTime(trimStart)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#BB232B] font-bold shrink-0">Out ] :</span>
            <input
              type="range"
              min="0"
              max={effectiveDuration}
              step="0.1"
              value={trimEnd}
              onChange={handleOutSliderChange}
              className="w-full h-1 bg-[#0a0f2b] rounded appearance-none cursor-pointer accent-[#BB232B]"
              title="Slide to adjust video end cut"
            />
            <span className="shrink-0 text-[#F8F3F0] font-semibold">{formatTime(trimEnd)}</span>
          </div>
        </div>

        {/* Multi-Track Layer Timeline (Caption Blocks Preview) */}
        <div className="relative w-full h-4 bg-[#0a0f2b] rounded-md border border-[#20309A]/30 overflow-hidden flex items-center">
          <span className="absolute left-1 text-[9px] font-bold text-[#F8F3F0]/40 z-10 select-none">
            TXT
          </span>
          {effectiveDuration > 0 && segments.map(seg => {
            const isActive = currentTime >= seg.start && currentTime <= seg.end;
            return (
              <div
                key={seg.id}
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = seg.start;
                    setCurrentTime(seg.start);
                  }
                }}
                title={seg.text}
                className={`absolute h-full rounded text-[8px] font-mono flex items-center px-1 overflow-hidden truncate cursor-pointer transition-all border ${
                  isActive
                    ? "bg-gradient-to-r from-[#20309A] to-[#2e44d4] text-[#F8F3F0] font-bold border-[#BB232B] shadow-sm z-20"
                    : "bg-[#20309A]/40 text-[#F8F3F0]/70 border-[#20309A]/60 hover:bg-[#20309A]/70"
                }`}
                style={{
                  left: `${(seg.start / effectiveDuration) * 100}%`,
                  width: `${Math.max(1.2, ((seg.end - seg.start) / effectiveDuration) * 100)}%`
                }}
              >
                {seg.text.slice(0, 15)}
              </div>
            );
          })}
        </div>

        {/* Playback Transport Buttons Row */}
        <div className="flex items-center justify-between text-xs text-[#F8F3F0]/80 pt-0.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-md bg-gradient-to-r from-[#20309A] to-[#2d42cc] text-[#F8F3F0] hover:from-[#293ecd] hover:to-[#3b51e6] shadow-md shadow-[#20309A]/30 border border-[#20309A] transition-all cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-[#F8F3F0]" /> : <Play className="w-3.5 h-3.5 fill-[#F8F3F0] ml-0.5" />}
            </button>

            <button
              onClick={() => skipSeconds(-3)}
              className="p-1 rounded hover:bg-[#20309A]/20 text-[#F8F3F0]/60 hover:text-[#F8F3F0] transition-all cursor-pointer"
              title="Rewind 3s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => skipSeconds(3)}
              className="p-1 rounded hover:bg-[#20309A]/20 text-[#F8F3F0]/60 hover:text-[#F8F3F0] transition-all cursor-pointer"
              title="Fast forward 3s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-xs text-[#F8F3F0]/60 ml-1">
              <span className="text-[#F8F3F0] font-semibold">{formatTime(currentTime)}</span> / {formatTime(effectiveDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleRate}
              className="px-2 py-0.5 rounded bg-[#0a0f2b] hover:bg-[#20309A]/30 font-mono text-[11px] text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded hover:bg-[#20309A]/20 text-[#F8F3F0]/60 hover:text-[#F8F3F0] transition-all cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#BB232B]" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

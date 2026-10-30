"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2
} from "lucide-react";
import CaptionOverlay from "./CaptionOverlay";

export default function VideoStage({
  videoSrc,
  segments,
  styleConfig,
  scriptMode = "romanized",
  currentTime = 0,
  setCurrentTime = () => {},
  duration = 30,
  setDuration = () => {},
  isPlaying = false,
  setIsPlaying = () => {}
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Keyboard Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  // Sync external seek requests
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.15) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // 60fps playhead sync
  useEffect(() => {
    let animId;
    const syncLoop = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
        animId = requestAnimationFrame(syncLoop);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(syncLoop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, setCurrentTime]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration || 30;
      setDuration(d);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const cycleRate = () => {
    const rates = [0.75, 1, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatShortTime = (sec = 0) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden select-none bg-[#090A0E] rounded-xl border border-[#1E202D]"
    >
      {/* 9:16 Centered Vertical Reel Container */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center p-2 relative">
        <div
          onClick={togglePlay}
          className="relative bg-black rounded-lg overflow-hidden shadow-2xl border border-[#232634] flex items-center justify-center cursor-pointer group"
          style={{
            aspectRatio: "9/16",
            maxHeight: "100%",
            maxWidth: "100%",
            height: "100%",
            width: "auto"
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-cover"
            playsInline
            loop={false}
            muted={isMuted}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Live Subtitle Overlay */}
          <CaptionOverlay
            segments={segments}
            currentTime={currentTime}
            styleConfig={styleConfig}
            scriptMode={scriptMode}
            isPlaying={isPlaying}
          />

          {/* Center Play Button on Pause */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none transition-all">
              <div className="w-14 h-14 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Underneath Video Player Controls Bar (Replix Style) */}
      <div className="w-full max-w-sm px-4 py-2 flex items-center justify-between text-xs text-[#8A8E9F] shrink-0 gap-3">
        {/* Play / Pause (White Circle) */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#E5C583] transition-all cursor-pointer shadow-md shrink-0"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Volume / Mute */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="p-1 hover:text-white transition-all cursor-pointer shrink-0"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-[#E0353E]" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        {/* Scrubber & Timecode */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            type="range"
            min="0"
            max={duration || 30}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-[#232634] rounded appearance-none cursor-pointer accent-[#E5C583]"
            title="Scrub video"
          />
          <span className="font-mono text-[11px] text-[#A6AABF] shrink-0 select-none">
            {formatShortTime(currentTime)} / {formatShortTime(duration)}
          </span>
        </div>

        {/* Playback Rate (1x) */}
        <button
          type="button"
          onClick={cycleRate}
          className="px-1.5 py-0.5 rounded text-[11px] font-mono hover:text-white hover:bg-[#1E202D] transition-all cursor-pointer shrink-0"
          title="Playback speed"
        >
          {playbackRate}x
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1 hover:text-white transition-all cursor-pointer shrink-0"
          title="Toggle fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

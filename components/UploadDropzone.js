"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Film, Sparkles, AlertCircle, Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export default function UploadDropzone({
  onFileSelected,
  isTranscribing,
  onLoadDemo,
  asrInfo,
  selectedLanguage = "auto",
  setSelectedLanguage = () => {}
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const fileInputRef = useRef(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (turnstileSiteKey && typeof window !== "undefined") {
      window.onTurnstileSuccess = (token) => {
        window.__cf_turnstile_token = token;
      };
      window.onTurnstileError = () => {
        setTurnstileFailed(true);
      };
      if (!document.getElementById("cf-turnstile-script")) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, [turnstileSiteKey]);

  const engineLabel = asrInfo?.engineName || "Telugu AI Speech Engine";
  const isCloudProvider = asrInfo?.activeEngine === "groq" || asrInfo?.activeEngine === "sarvam" || asrInfo?.activeEngine === "openai";

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndProceed = (file) => {
    setErrorMessage(null);
    if (!file) return;

    const validExtensions = ["mp4", "mov", "mkv", "webm", "avi", "m4v", "3gp", "ts", "qt", "flv"];
    const ext = file.name ? file.name.split(".").pop()?.toLowerCase() : "";
    const isVideoMime = file.type ? (file.type.startsWith("video/") || file.type.startsWith("audio/")) : false;

    if (!validExtensions.includes(ext) && !isVideoMime && ext !== "") {
      setErrorMessage("Please upload a valid video file (.mp4, .mov, .webm, .mkv)");
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProceed(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProceed(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-6 sm:p-10 flex flex-col items-center text-center">
      {/* Title & Hook */}
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1333] border border-[#20309A]/40 text-xs font-semibold shadow-sm">
          <span className={`w-2 h-2 rounded-full ${isCloudProvider ? "bg-emerald-400 animate-pulse" : "bg-[#BB232B] animate-pulse"}`} />
          <span className="text-[#F8F3F0] font-medium">{engineLabel}</span>
          {isCloudProvider && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] font-bold border border-[#BB232B]/40">
              Live Cloud ASR
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#F8F3F0] tracking-tight leading-tight">
          Create <span className="bg-gradient-to-r from-[#384DE8] via-[#F8F3F0] to-[#E0353E] bg-clip-text text-transparent">ManaCaption</span> in Seconds
        </h1>
        <p className="text-[#F8F3F0]/70 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Upload a Short or Reel, generate accurate Telugu &amp; Romanized captions, customize viral styles, and export your post-ready video.
        </p>
      </div>

      {/* Audio & Spoken Language Mode Selector */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-2 bg-[#090D24] p-1.5 rounded-2xl border border-[#20309A]/40 text-xs shadow-inner">
        <span className="text-[#F8F3F0]/60 font-medium px-2">
          Language:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedLanguage("auto")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedLanguage === "auto"
                ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-[#F8F3F0] shadow-md shadow-[#20309A]/40 font-bold"
                : "text-[#F8F3F0]/60 hover:text-white hover:bg-[#111840]"
            }`}
          >
            🌐 Auto-Detect
          </button>
          <button
            type="button"
            onClick={() => setSelectedLanguage("te")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedLanguage === "te"
                ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-[#F8F3F0] shadow-md shadow-[#20309A]/40 font-bold"
                : "text-[#F8F3F0]/60 hover:text-white hover:bg-[#111840]"
            }`}
          >
            🇮🇳 తెలుగు (Telugu)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLanguage("en")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedLanguage === "en"
                ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-[#F8F3F0] shadow-md shadow-[#20309A]/40 font-bold"
                : "text-[#F8F3F0]/60 hover:text-white hover:bg-[#111840]"
            }`}
          >
            🔤 English
          </button>
        </div>
      </div>

      {/* Upload Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload video file"
        className={`w-full p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer relative overflow-hidden group outline-none focus:border-[#384DE8] focus:ring-2 focus:ring-[#20309A]/30 ${
          isDragOver
            ? "border-[#BB232B] bg-[#20309A]/15 scale-[1.01]"
            : "border-[#20309A]/40 bg-[#0C1230]/60 hover:border-[#384DE8] hover:bg-[#0E1538]/80 shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
        }`}
      >
        <input
          id="studio-video-upload-input"
          ref={fileInputRef}
          type="file"
          accept="video/*,video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.mkv,.webm,.m4v,.3gp"
          onChange={handleChange}
          className="hidden"
        />

        {/* Floating background gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#20309A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated upload icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#070A1E] border border-[#20309A]/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#BB232B] transition-all shadow-[0_0_20px_rgba(32,48,154,0.3)]">
            {isTranscribing ? (
              <Loader2 className="w-8 h-8 text-[#384DE8] animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-[#F8F3F0]/80 group-hover:text-[#F8F3F0] transition-colors" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#F8F3F0] mb-1">
            {isTranscribing ? "Transcribing Telugu Speech..." : "Drop your Reel or Short here"}
          </h3>
          <p className="text-xs sm:text-sm text-[#F8F3F0]/60 max-w-sm mb-5">
            Supports MP4, MOV, WebM (up to 2 mins &amp; 100MB) · Dual-Script captions
          </p>

          {turnstileSiteKey && !turnstileFailed && (
            <div className="my-2.5 flex justify-center">
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onTurnstileSuccess"
                data-error-callback="onTurnstileError"
                data-theme="dark"
              />
            </div>
          )}

          <button
            id="studio-select-video-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-[#F8F3F0] text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(32,48,154,0.4)] flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Film className="w-4 h-4" />
            <span>Select Video File</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-2xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#E0353E]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Instant Demo Reel Shortcut */}
      <div className="mt-8 pt-6 border-t border-[#20309A]/30 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F8F3F0]/60">
        <span>Don&apos;t have a video file ready right now?</span>
        <button
          onClick={onLoadDemo}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] border border-[#20309A]/50 font-semibold transition-all hover:scale-105 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#384DE8]" />
          <span>Test with Instant Demo Reel</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-[#BB232B]" />
        </button>
      </div>
    </div>
  );
}

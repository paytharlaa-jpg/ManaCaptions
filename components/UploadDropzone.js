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
  const fileInputRef = useRef(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (turnstileSiteKey && typeof window !== "undefined") {
      window.onTurnstileSuccess = (token) => {
        window.__cf_turnstile_token = token;
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
    // Reset value so re-selecting the same file triggers onChange
    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto p-6 sm:p-10 flex flex-col items-center text-center">
      {/* Title & Hook */}
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold shadow-sm">
          <span className={`w-2 h-2 rounded-full ${isCloudProvider ? "bg-emerald-400 animate-pulse" : "bg-orange-400"}`} />
          <span className="text-white font-medium">{engineLabel}</span>
          {isCloudProvider && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
              Live Cloud ASR
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400">ManaCaptions</span> in Seconds
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto">
          Upload a Short or Reel, generate accurate Telugu & Romanized captions, customize viral styles, and export your post-ready video.
        </p>
      </div>

      {/* Audio & Spoken Language Mode Selector */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-2 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 text-xs shadow-inner">
        <span className="text-neutral-400 font-medium px-2">
          Language:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedLanguage("auto")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedLanguage === "auto"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            🌐 Auto-Detect
          </button>
          <button
            type="button"
            onClick={() => setSelectedLanguage("te")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedLanguage === "te"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            🇮🇳 తెలుగు (Telugu)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLanguage("en")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              selectedLanguage === "en"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
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
        className={`w-full p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer relative overflow-hidden group outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 ${
          isDragOver
            ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
            : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900/80"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated upload icon */}
          <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-orange-500/50 transition-all shadow-xl">
            {isTranscribing ? (
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-neutral-300 group-hover:text-orange-400 transition-colors" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            {isTranscribing ? "Transcribing Telugu Speech..." : "Drop your Reel or Short here"}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-4">
            Supports MP4, MOV, WebM, MKV · Automatically generates Dual-Script captions
          </p>

          {turnstileSiteKey && (
            <div className="my-2.5 flex justify-center">
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onTurnstileSuccess"
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Film className="w-4 h-4" />
            <span>Select Video File</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Instant Demo Reel Shortcut */}
      <div className="mt-8 pt-6 border-t border-neutral-800/80 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
        <span>Don&apos;t have a video file ready right now?</span>
        <button
          onClick={onLoadDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-orange-400 border border-orange-500/30 font-semibold transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Test with Instant Demo Reel</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}

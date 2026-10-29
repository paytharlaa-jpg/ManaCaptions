"use client";

import React, { useState } from "react";
import {
  Download,
  FileText,
  Video,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Film,
  CheckCircle2,
  Zap
} from "lucide-react";
import CreditCostModal from "@/components/CreditCostModal";
import GuestAuthModal from "@/components/GuestAuthModal";
import { PRICING_RULES } from "@/config/pricing";
import { useAuth } from "@/lib/authContext";
import { generateAssSubtitles } from "@/lib/assGenerator";

export default function ExportModal({
  segments,
  scriptMode,
  videoSrc,
  currentFile = null,
  styleConfig,
  filename = "telugu_reel",
duration = 0
}) {
  const { user, updateCreditsBalance } = useAuth();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);
  const [guestAction, setGuestAction] = useState("download_video");

  const lastSegEnd = segments && segments.length > 0 ? (segments[segments.length - 1]?.end || 0) : 0;
  const effectiveDuration = duration > 0 ? duration : (lastSegEnd > 0 ? lastSegEnd : 30);
  const exportCost = PRICING_RULES.calculateExportCost(effectiveDuration);

  const cleanInitialBase = (filename || "telugu_reel")
    .replace(/\.[^/.]+$/, "")
    .replace(/_manacaption$/i, "")
    .replace(/_captioned$/i, "");
  const [exportName, setExportName] = useState(cleanInitialBase);
  const [copied, setCopied] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState("Processing video frames...");
  const [exportedVideoUrl, setExportedVideoUrl] = useState(null);
  const [serverDownloadUrl, setServerDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState(`${cleanInitialBase}_manacaption.mp4`);
  const [isMp4Format, setIsMp4Format] = useState(true);
  const [aiHooksData, setAiHooksData] = useState(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Helper for guaranteed browser download with proper filename & extension
  const triggerSafeDownload = (contentOrBlob, mimeType, targetFilename) => {
    const blob = contentOrBlob instanceof Blob ? contentOrBlob : new Blob([contentOrBlob], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.position = "fixed";
    a.style.top = "-9999px";
    a.style.left = "-9999px";
    a.setAttribute("href", url);
    a.setAttribute("download", targetFilename);
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();

    // Keep URL alive for 15 seconds so browser download manager finishes saving file with correct name and extension
    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
      } catch {}
      URL.revokeObjectURL(url);
    }, 15000);
  };

  // Generate AI Viral Hooks & Instagram Caption
  const generateAiHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_hooks", segments, scriptMode })
      });
      const data = await res.json();
      if (data.ok) {
        setAiHooksData(data);
      }
    } catch (err) {
      console.error("AI Hooks generation failed:", err);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // Format seconds to SRT time
  const toSrtTime = (sec) => {
    const date = new Date(sec * 1000);
    const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
  };

  // Download SRT Subtitles
  const downloadSrt = () => {
    if (!user) {
      setGuestAction("download_srt");
      setGuestAuthOpen(true);
      return;
    }
    let srt = "";
    segments.forEach((seg, i) => {
      const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
      srt += `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${text}\n\n`;
    });

    const safeBase = (exportName || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    triggerSafeDownload(srt, "text/plain;charset=utf-8", `${safeBase}_subtitles.srt`);
  };

  // Download VTT Subtitles
  const downloadVtt = () => {
    if (!user) {
      setGuestAction("download_srt");
      setGuestAuthOpen(true);
      return;
    }
    let vtt = "WEBVTT\n\n";
    segments.forEach((seg, i) => {
      const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
      const srtStart = toSrtTime(seg.start).replace(',', '.');
      const srtEnd = toSrtTime(seg.end).replace(',', '.');
      vtt += `${srtStart} --> ${srtEnd}\n${text}\n\n`;
    });

    const safeBase = (exportName || "telugu_reel").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    triggerSafeDownload(vtt, "text/vtt;charset=utf-8", `${safeBase}_subtitles.vtt`);
  };

  // Trigger render: handles guest check and credit confirmation
  const handleRenderClick = () => {
    if (!user) {
      setGuestAction("download_video");
      setGuestAuthOpen(true);
      return;
    }
    if (exportCost > 0) {
      setCostModalOpen(true);
    } else {
      renderBurnedVideo();
    }
  };

  // Copy full script to clipboard for Instagram post captions
  const copyScriptText = () => {
    const fullText = segments
      .map(s => (scriptMode === "romanized" && s.romanizedText ? s.romanizedText : s.text))
      .join(" ");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Burned-In MP4 Video (Direct Hardware ASS Burn on Server + Client Fallback)
  const renderBurnedVideo = async () => {
    if (!videoSrc) return;
    setIsExportingVideo(true);
    setExportProgress(15);
    setExportStatusText("Preparing pristine source video...");
    setExportedVideoUrl(null);

    try {
      // 1. Obtain pristine source video Blob
      let videoBlob = currentFile;
      if (!videoBlob) {
        try {
          const fetchRes = await fetch(videoSrc);
          videoBlob = await fetchRes.blob();
        } catch (fetchErr) {
          console.warn("Could not fetch videoSrc blob directly:", fetchErr);
        }
      }

      // 2. Measure native resolution
      setExportProgress(35);
      setExportStatusText("Generating synchronized subtitle styling...");

      const tempVideo = document.createElement("video");
      tempVideo.src = videoSrc;
      tempVideo.preload = "metadata";
      await new Promise((resolve) => {
        if (tempVideo.readyState >= 1) return resolve();
        tempVideo.onloadedmetadata = () => resolve();
        tempVideo.onerror = () => resolve();
        setTimeout(resolve, 1500);
      });

      const videoWidth = tempVideo.videoWidth || 720;
      const videoHeight = tempVideo.videoHeight || 1280;

      // 3. Generate ASS Subtitles
      const assSubtitles = generateAssSubtitles({
        segments,
        styleConfig,
        scriptMode,
        videoWidth,
        videoHeight
      });

      // 4. Primary Route: Direct High-Speed Server-Side FFmpeg Subtitle Burn
      if (videoBlob) {
        setExportProgress(65);
        setExportStatusText("Burning styled captions directly into video frames...");

        const formData = new FormData();
        const sendFilename = currentFile?.name || (filename ? `${filename}.mp4` : "video.mp4");
        formData.append("video", videoBlob, sendFilename);
        formData.append("filename", exportName || "telugu_reel");
        formData.append("duration", effectiveDuration);
        formData.append("subtitlesAss", assSubtitles);

        const res = await fetch("/api/export", {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.downloadUrl) {
            setServerDownloadUrl(data.downloadUrl);
            const cleanBase = (exportName || filename || "video")
              .replace(/\.[^/.]+$/, "")
              .replace(/_manacaption$/i, "")
              .replace(/_captioned$/i, "")
              .replace(/[^a-zA-Z0-9_-]/g, "_") || "video";
            setDownloadFilename(data.filename || `${cleanBase}_manacaption.mp4`);
            setExportedVideoUrl(data.downloadUrl);
            setIsMp4Format(true);
            setExportProgress(100);
            setIsExportingVideo(false);
            setExportStatusText("Universal MP4 video rendered and ready!");
            if (data.creditsRemaining !== undefined && updateCreditsBalance) {
              updateCreditsBalance(data.creditsRemaining);
            }
            return;
          }
        } else if (res.status === 401) {
          setIsExportingVideo(false);
          setGuestAction("download_video");
          setGuestAuthOpen(true);
          return;
        } else {
          console.warn("Direct server burn returned non-ok, falling back to client canvas...");
        }
      }

      // 5. Fallback Route: Client Canvas Compositor (if direct server burn is unavailable)
      await runClientCanvasFallback(tempVideo);

    } catch (err) {
      console.error("Video export error:", err);
      setIsExportingVideo(false);
      setExportProgress(0);
      alert("Video export encountered an error: " + err.message);
    }
  };

  // Client-Side Canvas Compositor (Lag-Free Hardware Synchronized Renderer)
  const runClientCanvasFallback = async (video) => {
    let audioCtx = null;
    let frameCallbackId = null;
    let animId = null;

    try {
      setExportProgress(40);
      setExportStatusText("Compositing smooth video frames...");

      // CRITICAL: Position inside viewport with subtle opacity so Chrome NEVER throttles frame rate
      video.playsInline = true;
      video.preload = "auto";
      video.muted = false;
      video.style.position = "fixed";
      video.style.top = "0";
      video.style.left = "0";
      video.style.width = "320px";
      video.style.height = "568px";
      video.style.opacity = "0.002"; // Active in viewport = 100% GPU priority (no 1fps throttle!)
      video.style.pointerEvents = "none";
      video.style.zIndex = "-1";

      if (!video.parentNode && typeof document !== "undefined") {
        document.body.appendChild(video);
      }

      await new Promise((resolve) => {
        if (video.readyState >= 2) return resolve();
        video.onloadeddata = () => resolve();
        setTimeout(resolve, 2000);
      });

      // Target clean standard resolution (max 1080p, optimal 720p for silky performance)
      let targetW = video.videoWidth || 720;
      let targetH = video.videoHeight || 1280;
      if (targetW > 1080 || targetH > 1920) {
        const scale = Math.min(1080 / targetW, 1920 / targetH);
        targetW = Math.round(targetW * scale);
        targetH = Math.round(targetH * scale);
      }
      if (targetW % 2 !== 0) targetW--;
      if (targetH % 2 !== 0) targetH--;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
      canvas.width = targetW;
      canvas.height = targetH;

      // Extract Clean Synchronized Audio Track via Web Audio Destination
      let audioTrack = null;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          if (audioCtx.state === "suspended") await audioCtx.resume();
          const source = audioCtx.createMediaElementSource(video);
          const destination = audioCtx.createMediaStreamDestination();
          source.connect(destination);
          const aTracks = destination.stream.getAudioTracks();
          if (aTracks.length > 0) audioTrack = aTracks[0];
        }
      } catch (aErr) {
        console.warn("Web Audio capture notice:", aErr);
      }

      if (!audioTrack) {
        try {
          const captureMethod = video.captureStream || video.mozCaptureStream;
          if (typeof captureMethod === "function") {
            const vStream = captureMethod.call(video);
            const aTracks = vStream.getAudioTracks();
            if (aTracks.length > 0) audioTrack = aTracks[0];
          }
        } catch {}
      }

      // Smooth 30 FPS Stream
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioTrack) combinedTracks.push(audioTrack);
      const combinedStream = new MediaStream(combinedTracks);

      // Prioritize MP4 container if browser supports it
      const candidateMimes = [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=h264,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
      ];

      let selectedMime = "";
      for (const m of candidateMimes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorderOptions = selectedMime
        ? { mimeType: selectedMime, audioBitsPerSecond: 192000, videoBitsPerSecond: 6000000 }
        : { audioBitsPerSecond: 192000, videoBitsPerSecond: 6000000 };

      const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const duration = video.duration || 10;
      let isRecording = true;

      const stopRecording = () => {
        if (!isRecording) return;
        isRecording = false;
        if (typeof video.cancelVideoFrameCallback === "function" && frameCallbackId) {
          video.cancelVideoFrameCallback(frameCallbackId);
        }
        if (animId) cancelAnimationFrame(animId);
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      };

      video.onended = stopRecording;

      mediaRecorder.onstop = () => {
        if (audioCtx && audioCtx.state !== "closed") {
          audioCtx.close().catch(() => {});
        }
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }

        const recordedMime = mediaRecorder.mimeType || "video/webm";
        const rawBlob = new Blob(chunks, { type: recordedMime });

        if (rawBlob.size === 0) {
          setIsExportingVideo(false);
          alert("Recording produced 0 frames. Please try again.");
          return;
        }

        const cleanFallbackBase = (exportName || filename || "video")
          .replace(/\.[^/.]+$/, "")
          .replace(/_manacaption$/i, "")
          .replace(/_captioned$/i, "")
          .replace(/[^a-zA-Z0-9_-]/g, "_") || "video";

        const isMp4 = recordedMime.includes("mp4");
        const ext = isMp4 ? ".mp4" : ".webm";
        const fallbackName = `${cleanFallbackBase}_manacaption${ext}`;
        const downloadUrl = URL.createObjectURL(rawBlob);

        setExportedVideoUrl(downloadUrl);
        setServerDownloadUrl(downloadUrl);
        setDownloadFilename(fallbackName);
        setIsMp4Format(isMp4);
        setExportProgress(100);
        setIsExportingVideo(false);
        setExportStatusText("Video rendered smoothly and ready to download!");
      };

      // Start recording with 100ms slices for smooth memory streaming
      mediaRecorder.start(100);
      video.currentTime = 0;
      setExportStatusText("Compositing synchronized frames...");

      try {
        await video.play();
      } catch (playErr) {
        video.muted = true;
        await video.play();
      }

      // Draw frames using requestVideoFrameCallback (zero dropped frames!)
      const renderNextFrame = () => {
        if (!isRecording) return;

        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          renderCaptionFrame(video.currentTime, canvas, ctx);
          setExportProgress(Math.min(95, Math.round((video.currentTime / duration) * 95)));
        }

        if (video.ended || video.currentTime >= duration - 0.05) {
          stopRecording();
          return;
        }

        if (typeof video.requestVideoFrameCallback === "function") {
          frameCallbackId = video.requestVideoFrameCallback(renderNextFrame);
        } else {
          animId = requestAnimationFrame(renderNextFrame);
        }
      };

      if (typeof video.requestVideoFrameCallback === "function") {
        frameCallbackId = video.requestVideoFrameCallback(renderNextFrame);
      } else {
        animId = requestAnimationFrame(renderNextFrame);
      }
    } catch (err) {
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      throw err;
    }
  };

  // Canvas Subtitle Drawer helper for fallback
  const renderCaptionFrame = (curTime, canvas, ctx) => {
    let active = segments.find(s => curTime >= s.start && curTime <= s.end);
    if (!active) {
      active = segments.find(s => curTime >= (s.start - 0.05) && curTime <= (s.end + 0.25));
    }
    if (!active) return;

    const isRomanized = scriptMode === "romanized";
    const rawText = isRomanized
      ? (active.romanizedText || active.text || "")
      : (active.text || active.romanizedText || "");

    if (!rawText.trim()) return;

    const applyTransform = (text) => {
      if (!text) return "";
      switch (styleConfig.textCase) {
        case "upper": return text.toUpperCase();
        case "lower": return text.toLowerCase();
        case "capitalize": return text.replace(/\b\w/g, l => l.toUpperCase());
        default: return text;
      }
    };

    const textWords = rawText.trim().split(/\s+/).filter(Boolean);
    const totalDuration = Math.max(0.1, active.end - active.start);
    const wordDuration = totalDuration / Math.max(1, textWords.length);

    const words = textWords.map((word, idx) => {
      const start = active.start + idx * wordDuration;
      const end = start + wordDuration;
      return {
        word: applyTransform(word),
        start,
        end,
        isActive: Boolean(styleConfig.karaoke && curTime >= start && curTime <= end)
      };
    });

    const userPct = Number(styleConfig.fontSizePct) || 2.2;
    const fontRatio = userPct / 2.2;
    const fontSize = Math.max(28, Math.round(canvas.height * 0.042 * fontRatio));
    const fontWeight = styleConfig.fontWeight || 700;
    const fontFamily = styleConfig.fontFamily || "NTR";
    const lineHeight = (styleConfig.lineHeight || 1.15) * fontSize;

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", "Nirmala UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textBaseline = "middle";

    const spaceWidth = ctx.measureText(" ").width;
    const maxLineWidth = canvas.width * ((styleConfig.maxWidthPct || 84) / 100);

    const lines = [];
    let currentLine = [];
    let currentLineWidth = 0;

    for (const w of words) {
      const wordWidth = ctx.measureText(w.word).width;
      if (currentLine.length > 0 && currentLineWidth + spaceWidth + wordWidth > maxLineWidth) {
        lines.push({ items: currentLine, width: currentLineWidth });
        currentLine = [{ ...w, width: wordWidth }];
        currentLineWidth = wordWidth;
      } else {
        currentLine.push({ ...w, width: wordWidth });
        currentLineWidth += (currentLine.length > 1 ? spaceWidth : 0) + wordWidth;
      }
    }
    if (currentLine.length > 0) {
      lines.push({ items: currentLine, width: currentLineWidth });
    }

    const totalTextHeight = lines.length * lineHeight;
    const maxMeasuredWidth = Math.max(...lines.map(l => l.width), 0);
    const centerPosY = (styleConfig.positionYPct / 100) * canvas.height;
    const startY = centerPosY - (totalTextHeight / 2) + (lineHeight / 2);
    const isNegative = styleConfig.textEffect === "negative";

    const hasBoxMode = (styleConfig.boxMode === "box" || styleConfig.boxMode === "rounded" || isNegative);
    if (hasBoxMode) {
      const padX = fontSize * (styleConfig.bgPaddingXPct || 0.8);
      const padY = fontSize * (styleConfig.bgPaddingYPct || 0.4);
      const boxX = (canvas.width - maxMeasuredWidth) / 2 - padX;
      const boxY = centerPosY - (totalTextHeight / 2) - padY;
      const boxW = maxMeasuredWidth + padX * 2;
      const boxH = totalTextHeight + padY * 2;
      const radius = styleConfig.boxMode === "rounded"
        ? Math.min(boxH / 2, fontSize * 0.8)
        : Math.round(fontSize * 0.25);

      ctx.save();
      ctx.fillStyle = isNegative ? "#FFFFFF" : (styleConfig.backgroundColor || "rgba(0,0,0,0.85)");
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, radius);
        ctx.fill();
      } else {
        ctx.fillRect(boxX, boxY, boxW, boxH);
      }
      ctx.restore();
    }

    lines.forEach((line, lineIdx) => {
      const lineY = startY + lineIdx * lineHeight;
      let curX = (canvas.width - line.width) / 2;

      line.items.forEach((item, itemIdx) => {
        if (itemIdx > 0) curX += spaceWidth;
        ctx.save();

        let wordColor = isNegative ? "#000000" : (styleConfig.color || "#FFFFFF");
        if (!isNegative && item.isActive) {
          wordColor = styleConfig.highlightColor || "#BB232B";
        }

        if (!isNegative && styleConfig.shadow) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
          ctx.shadowBlur = Math.round(fontSize * 0.2);
          ctx.shadowOffsetY = Math.round(fontSize * 0.08);
        }

        if (!isNegative && styleConfig.outlineWidth > 0) {
          const strokeW = Math.max(1, Math.round(styleConfig.outlineWidth * (fontSize / 32)));
          ctx.strokeStyle = styleConfig.outlineColor || "#000000";
          ctx.lineWidth = strokeW * 2;
          ctx.lineJoin = "round";
          ctx.strokeText(item.word, curX, lineY);
        }

        ctx.fillStyle = wordColor;
        ctx.fillText(item.word, curX, lineY);
        ctx.restore();

        curX += item.width;
      });
    });

    ctx.restore();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f26]/85 backdrop-blur-xl rounded-2xl border border-[#20309A]/40 p-5 overflow-y-auto space-y-6 min-h-0 shadow-2xl shadow-[#20309A]/15 relative">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-[#F8F3F0] flex items-center gap-2">
          <Film className="w-4 h-4 text-[#BB232B]" />
          <span>Export & Download Studio</span>
        </h2>
        <p className="text-xs text-[#F8F3F0]/60 mt-1">
          Export your post-ready burned video or download subtitle files for Instagram, YouTube, and Facebook.
        </p>
      </div>

      {/* Filename Input */}
      <div>
        <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
          Export File Name
        </label>
        <div className="flex items-center">
          <input
            type="text"
            value={exportName}
            onChange={e => setExportName(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#060919] border border-[#20309A]/40 rounded-l-lg text-[#F8F3F0] text-xs font-mono focus:border-[#20309A] focus:outline-none"
            placeholder="my_telugu_reel"
          />
          <span className="px-3 py-2 bg-[#0a0f2b] border border-l-0 border-[#20309A]/40 text-[#F8F3F0]/60 font-mono text-xs rounded-r-lg">
            .mp4
          </span>
        </div>
      </div>

      {/* Section 1: Burned Video Export */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#060919] via-[#0a0f2b] to-[#060919] border border-[#20309A]/40 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#F8F3F0] flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#2e44d4]" />
              <span>Burned-In Subtitle Video</span>
            </span>
            <p className="text-[11px] text-[#F8F3F0]/60 mt-0.5">
              Hardcodes your styled captions directly into the video frames with full synchronized audio.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              <span>{exportCost > 0 ? `${exportCost} ${exportCost === 1 ? 'Credit' : 'Credits'}` : "Free Export"}</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#20309A]/30 text-[#F8F3F0] border border-[#20309A]/50 font-bold">
              H.264 / AAC MP4
            </span>
          </div>
        </div>

        {/* Export Progress Bar */}
        {isExportingVideo && (
          <div className="space-y-1.5 py-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#BB232B] font-bold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#BB232B]" />
                <span>{exportStatusText}</span>
              </span>
              <span className="text-[#F8F3F0] font-bold">{exportProgress}%</span>
            </div>
            <div className="w-full h-2 bg-[#060919] rounded-full overflow-hidden border border-[#20309A]/30">
              <div
                className="h-full bg-gradient-to-r from-[#20309A] via-[#3a53ec] to-[#BB232B] transition-all duration-200"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button & In-Modal Video Preview Player */}
        {!exportedVideoUrl ? (
          <button
            onClick={handleRenderClick}
            disabled={isExportingVideo}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#20309A] via-[#2d42cc] to-[#BB232B] hover:from-[#293ecf] hover:to-[#cd2833] text-[#F8F3F0] text-xs font-bold shadow-lg shadow-[#20309A]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-[#20309A]"
          >
            {isExportingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#F8F3F0]" />
                <span>{exportStatusText}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Render Burned MP4 Video</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Ready! Universal MP4 with Audio</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                100% Playable
              </span>
            </div>

            {/* In-Modal Video & Audio Preview Player */}
            <div className="rounded-xl overflow-hidden border border-[#20309A]/40 bg-black p-2 flex flex-col items-center">
              <video
                controls
                controlsList="nodownload"
                src={serverDownloadUrl || exportedVideoUrl}
                className="w-full max-h-56 rounded-lg bg-black object-contain"
                playsInline
              />
              <span className="text-[10px] text-[#F8F3F0]/50 mt-1.5 font-mono">
                Preview video & audio playback before downloading
              </span>
            </div>

            <div className="flex gap-2">
              {user ? (
                <a
                  href={serverDownloadUrl || exportedVideoUrl}
                  download={downloadFilename}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#20309A] to-[#2d42cc] hover:from-[#2a3ecc] hover:to-[#3b51e6] text-[#F8F3F0] text-xs font-bold shadow-lg shadow-[#20309A]/40 flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#20309A]"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Final MP4 (.mp4)</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    setGuestAction("download_video");
                    setGuestAuthOpen(true);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#20309A] via-[#2d42cc] to-[#BB232B] hover:from-[#293ecf] hover:to-[#cd2833] text-[#F8F3F0] text-xs font-bold shadow-lg shadow-[#20309A]/30 flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#20309A]"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Sign In to Download MP4</span>
                </button>
              )}

              <button
                onClick={handleRenderClick}
                className="py-2.5 px-3 rounded-xl bg-[#0a0f2b] hover:bg-[#20309A]/30 text-[#F8F3F0] text-xs font-semibold transition-all cursor-pointer border border-[#20309A]/40"
                title="Re-render video"
              >
                Re-render
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Subtitle Files (.SRT & .VTT) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#F8F3F0]/80">
            Subtitle Files (Timed Captions)
          </label>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
            FREE · 0 Credits (Manual Editing)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={downloadSrt}
            className="p-3 rounded-xl bg-[#060919] border border-[#20309A]/35 hover:border-[#20309A] hover:bg-[#0a0f2b] text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-[#F8F3F0]">SubRip (.SRT)</span>
              <FileText className="w-4 h-4 text-[#2e44d4] group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[10px] text-[#F8F3F0]/60">
              Standard subtitles for YouTube, Premiere Pro & CapCut
            </p>
          </button>

          <button
            onClick={downloadVtt}
            className="p-3 rounded-xl bg-[#060919] border border-[#20309A]/35 hover:border-[#20309A] hover:bg-[#0a0f2b] text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-[#F8F3F0]">WebVTT (.VTT)</span>
              <FileText className="w-4 h-4 text-[#BB232B] group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[10px] text-[#F8F3F0]/60">
              Formatted for web players and online video streaming
            </p>
          </button>
        </div>
      </div>

      {/* Section 3: AI Viral Hooks & Instagram Post Caption */}
      <div className="p-3 bg-gradient-to-br from-[#060919] via-[#0a0f2b] to-[#060919] rounded-xl border border-[#20309A]/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#BB232B]" />
            <span className="text-xs font-bold text-[#F8F3F0]">AI Viral Hooks & Post Caption</span>
          </div>
          <button
            onClick={generateAiHooks}
            disabled={isGeneratingHooks || segments.length === 0}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-gradient-to-r from-[#20309A] to-[#2d42cc] hover:from-[#2a3ecc] hover:to-[#3b51e6] text-[#F8F3F0] font-bold transition-all cursor-pointer disabled:opacity-50 border border-[#20309A] shadow-md shadow-[#20309A]/30"
          >
            {isGeneratingHooks ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[#F8F3F0]" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate AI Hooks</span>
            )}
          </button>
        </div>

        {aiHooksData ? (
          <div className="space-y-3 pt-2 border-t border-[#20309A]/30 text-xs">
            {/* 3 Opening Hooks */}
            <div>
              <span className="text-[11px] font-semibold text-[#F8F3F0]/70 block mb-1">
                Viral 3-Second Opening Hooks (Click to copy):
              </span>
              <div className="space-y-1.5">
                {aiHooksData.hooks?.map((hook, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigator.clipboard.writeText(hook);
                      alert("Hook copied to clipboard!");
                    }}
                    className="w-full text-left p-2 rounded-lg bg-[#060919] hover:bg-[#20309A]/20 border border-[#20309A]/30 text-[#F8F3F0] font-medium text-xs transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{hook}</span>
                    <Copy className="w-3 h-3 text-[#F8F3F0]/50 group-hover:text-[#F8F3F0] shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Ready-to-Post Instagram Caption */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#F8F3F0]/70">
                  Formatted Instagram Post Caption & Hashtags:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiHooksData.postCaption);
                    setCopiedCaption(true);
                    setTimeout(() => setCopiedCaption(false), 2000);
                  }}
                  className="text-[10px] text-[#2e44d4] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
                </button>
              </div>
              <div className="p-2.5 bg-[#060919] border border-[#20309A]/40 rounded-lg text-[#F8F3F0]/80 font-mono text-[11px] max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {aiHooksData.postCaption}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-[#F8F3F0]/60 leading-normal">
            Click &quot;Generate AI Hooks&quot; to auto-generate 3-second opening hook titles and a viral Instagram description with hashtags from your transcript.
          </p>
        )}
      </div>

      {/* Section 4: Copy Raw Transcript Text */}
      <div className="pt-1">
        <button
          onClick={copyScriptText}
          className="w-full py-2 px-3 rounded-lg bg-[#060919] border border-[#20309A]/30 hover:bg-[#20309A]/20 text-[#F8F3F0]/80 hover:text-[#F8F3F0] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Raw Subtitle Script</span>
            </>
          )}
        </button>
      </div>

      {/* Pre-Processing Credit Cost Confirmation Modal */}
      <CreditCostModal
        isOpen={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        onConfirm={() => {
          setCostModalOpen(false);
          renderBurnedVideo();
        }}
        actionTitle="Export Burned-In MP4 Video"
        cost={exportCost}
        durationSec={effectiveDuration}
        currentBalance={user?.credits_balance ?? 10}
      />

      {/* Phase 6: Guest Trial Login Modal */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType={guestAction}
        onSuccess={() => {
          if (guestAction === "download_srt") {
            downloadSrt();
          } else if (guestAction === "download_video") {
            renderBurnedVideo();
          }
        }}
      />
    </div>
  );
}

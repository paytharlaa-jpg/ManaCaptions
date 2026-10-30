"use client";

import { extractAudioInBrowser } from "@/lib/audioExtractor";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import UploadDropzone from "@/components/UploadDropzone";
import VideoStage from "@/components/VideoStage";
import CaptionsReviewList from "@/components/CaptionsReviewList";
import TemplatesPanel from "@/components/TemplatesPanel";
import MultiTrackTimeline from "@/components/MultiTrackTimeline";
import ExportModal from "@/components/ExportModal";
import CreditCostModal from "@/components/CreditCostModal";
import GuestAuthModal from "@/components/GuestAuthModal";
import { DEFAULT_STYLE } from "@/lib/presets";
import { SAMPLE_PROJECT } from "@/lib/sampleDemo";
import { chunkSegmentsToFourFiveWords } from "@/lib/captionPacing";
import { PRICING_RULES } from "@/config/pricing";
import { useAuth } from "@/lib/authContext";

async function parseApiResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  const text = await res.text();
  if (res.status === 413) {
    throw new Error("Video file is too large for the server (HTTP 413).");
  }
  if (res.status === 504 || res.status === 502) {
    throw new Error("Server timeout or gateway error (HTTP " + res.status + ").");
  }
  if (res.status === 500) {
    throw new Error("Internal Server Error (HTTP 500).");
  }
  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    throw new Error("Server error (" + res.status + "): " + titleMatch[1]);
  }
  throw new Error("Server returned an invalid response (HTTP " + res.status + ")");
}

export default function StudioApp() {
  // Video and project state
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFilename, setVideoFilename] = useState("telugu_reel.mp4");
  const [currentFile, setCurrentFile] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  // Editor configuration
  const [styleConfig, setStyleConfig] = useState(DEFAULT_STYLE);
  const [scriptMode, setScriptMode] = useState("romanized"); // 'romanized' | 'telugu' | 'both'
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [asrInfo, setAsrInfo] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");

  const { user, updateCreditsBalance } = useAuth();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);
  const [guestAction, setGuestAction] = useState("download_video");
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Fetch active ASR provider status & handle post-login action on mount
  useEffect(() => {
    fetch("/api/transcribe")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setAsrInfo(data);
      })
      .catch(err => console.warn("Could not query ASR status:", err));
  }, []);

  // Auto-sync trimRange when duration changes
  useEffect(() => {
    if (duration > 0) {
      setTrimRange(prev => {
        if (prev.end === 0 || prev.end > duration) {
          return { start: Math.min(prev.start, duration), end: duration };
        }
        return prev;
      });
    }
  }, [duration]);

  // Load Built-in Demo Reel Sample
  const handleLoadDemo = () => {
    setVideoSrc(SAMPLE_PROJECT.videoUrl);
    setVideoFilename(SAMPLE_PROJECT.filename);
    setCurrentFile(null);
    setSegments(chunkSegmentsToFourFiveWords(SAMPLE_PROJECT.segments));
    setDuration(SAMPLE_PROJECT.durationSec);
    setTrimRange({ start: 0, end: SAMPLE_PROJECT.durationSec });
    setCurrentTime(0);
    setIsPlaying(false);
    setScriptMode("romanized");
  };

  // Reset Video
  const handleResetVideo = () => {
    if (videoSrc && videoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setCurrentFile(null);
    setSegments([]);
    setTrimRange({ start: 0, end: 0 });
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Download .SRT directly from top bar
  const handleDownloadSrt = () => {
    if (!segments || segments.length === 0) return;
    const toSrtTime = (sec = 0) => {
      const date = new Date(sec * 1000);
      const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
      const mm = String(date.getUTCMinutes()).padStart(2, "0");
      const ss = String(date.getUTCSeconds()).padStart(2, "0");
      const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
      return `${hh}:${mm}:${ss},${ms}`;
    };

    let srt = "";
    segments.forEach((seg, i) => {
      const text = scriptMode === "romanized" && seg.romanizedText ? seg.romanizedText : seg.text;
      srt += `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${text}\n\n`;
    });

    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanName = (videoFilename || "telugu_reel").replace(/\.[^/.]+$/, "");
    a.download = `${cleanName}_subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 10000);
  };

  // Run transcription API call
  const executeTranscriptionApi = async ({ file, lang, durationSec, objectUrl }) => {
    setVideoSrc(objectUrl);
    setVideoFilename(file.name);
    setCurrentFile(file);
    setIsTranscribing(true);

    try {
      const targetLang = lang || "auto";
      const formData = new FormData();

      let uploadFile = file;
      try {
        const extracted = await extractAudioInBrowser(file);
        if (extracted) uploadFile = extracted;
      } catch (extractErr) {
        console.warn("Client audio extraction fallback:", extractErr);
      }

      formData.append("file", uploadFile);
      formData.append("language", targetLang);
      formData.append("duration", String(durationSec));

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await parseApiResponse(res);
      if (data.ok && data.segments && data.segments.length > 0) {
        const paced = chunkSegmentsToFourFiveWords(data.segments);
        setSegments(paced);
        const lastSeg = paced[paced.length - 1];
        setDuration(prev => Math.max(prev || 0, durationSec || 0, lastSeg ? (lastSeg.end + 0.5) : 0));

        const hasTelugu = paced.some(s => /[\u0C00-\u0C7F]/.test(s.text));
        setScriptMode(hasTelugu ? "both" : "romanized");

        if (data.creditsRemaining !== undefined && updateCreditsBalance) {
          updateCreditsBalance(data.creditsRemaining);
        }
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.warn("Transcription API error:", err);
      alert("Transcription error: " + (err.message || "Failed to transcribe"));
    } finally {
      setIsTranscribing(false);
      setPendingAction(null);
    }
  };

  // Handle User Uploaded File
  const handleFileSelected = (file, lang = selectedLanguage) => {
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("Video file exceeds the 100MB limit. Please compress or trim your video.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = objectUrl;

    let triggered = false;
    const triggerProcess = (dur) => {
      if (triggered) return;
      triggered = true;
      const validDur = Math.max(1, Math.ceil(dur || 30));

      if (validDur > 180) {
        alert("ManaCaptions supports videos up to 3 minutes. Please trim your video to continue.");
        URL.revokeObjectURL(objectUrl);
        return;
      }

      executeTranscriptionApi({ file, lang, durationSec: validDur, objectUrl });
    };

    tempVideo.onloadedmetadata = () => triggerProcess(tempVideo.duration);
    tempVideo.onerror = () => triggerProcess(30);
    setTimeout(() => { if (!triggered) triggerProcess(30); }, 1500);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0D0E12] text-[#FFFFFF] relative selection:bg-[#E5C583] selection:text-black">
      {/* Top Header Bar (Screenshot 5) */}
      <Navbar
        hasVideo={!!videoSrc}
        onLoadDemo={handleLoadDemo}
        onResetVideo={handleResetVideo}
        onDownloadSrt={handleDownloadSrt}
        onExportClick={() => setExportModalOpen(true)}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {!videoSrc ? (
          // Ingestion Screen (Upload / Demo)
          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <UploadDropzone
              onFileSelected={handleFileSelected}
              isTranscribing={isTranscribing}
              onLoadDemo={handleLoadDemo}
              asrInfo={asrInfo}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
            />
          </div>
        ) : (
          // Exact Screenshot 5 Studio: 3 Columns Workspace + Full-Width Bottom Timeline
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0D0E12]">
            {/* 3 Columns Row: Left Captions (w-72), Center 9:16 Video, Right Templates (w-72) */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5 p-2.5 sm:p-3 overflow-hidden">
              {/* Left Column: CAPTIONS review list (Screenshot 5) */}
              <div className="col-span-12 lg:col-span-3 xl:col-span-3 h-full min-h-0 overflow-hidden">
                <CaptionsReviewList
                  segments={segments}
                  setSegments={setSegments}
                  currentTime={currentTime}
                  onSeek={setCurrentTime}
                  scriptMode={scriptMode}
                  setScriptMode={setScriptMode}
                  isPlaying={isPlaying}
                />
              </div>

              {/* Center Column: 9:16 Vertical Phone Player Stage */}
              <div className="col-span-12 lg:col-span-6 xl:col-span-6 h-full min-h-0 overflow-hidden flex flex-col">
                <VideoStage
                  videoSrc={videoSrc}
                  segments={segments}
                  styleConfig={styleConfig}
                  scriptMode={scriptMode}
                  currentTime={currentTime}
                  setCurrentTime={setCurrentTime}
                  duration={duration}
                  setDuration={setDuration}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                />
              </div>

              {/* Right Column: TEMPLATES (Yellow, Minimal, Animated...) */}
              <div className="col-span-12 lg:col-span-3 xl:col-span-3 h-full min-h-0 overflow-hidden">
                <TemplatesPanel
                  styleConfig={styleConfig}
                  setStyleConfig={setStyleConfig}
                />
              </div>
            </div>

            {/* Bottom: Full-Width Multi-Track Timeline (Screenshot 5) */}
            <MultiTrackTimeline
              duration={duration}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              isPlaying={isPlaying}
              togglePlay={() => setIsPlaying(!isPlaying)}
              segments={segments}
              setSegments={setSegments}
              videoSrc={videoSrc}
              currentFile={currentFile}
            />
          </div>
        )}
      </main>

      {/* Export & Render Modal Dialog (Opened when clicking gold Export button in Navbar) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        segments={segments}
        scriptMode={scriptMode}
        videoSrc={videoSrc}
        currentFile={currentFile}
        styleConfig={styleConfig}
        filename={videoFilename}
        duration={duration}
        trimRange={trimRange}
      />

      {/* Guest Trial Login Modal with Terms Checkboxes (Screenshots 3 & 4) */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType={guestAction}
        onSuccess={() => {
          if (guestAction === "download_video") {
            setExportModalOpen(true);
          }
        }}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import UploadDropzone from "@/components/UploadDropzone";
import VideoStage from "@/components/VideoStage";
import TranscriptEditor from "@/components/TranscriptEditor";
import StyleCustomizer from "@/components/StyleCustomizer";
import ExportModal from "@/components/ExportModal";
import CreditCostModal from "@/components/CreditCostModal";
import GuestAuthModal from "@/components/GuestAuthModal";
import { DEFAULT_STYLE } from "@/lib/presets";
import { SAMPLE_PROJECT } from "@/lib/sampleDemo";
import { PRICING_RULES } from "@/config/pricing";
import { useAuth } from "@/lib/authContext";

export default function StudioApp() {
  // Video and project state
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFilename, setVideoFilename] = useState("telugu_reel.mp4");
  const [currentFile, setCurrentFile] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Editor configuration
  const [styleConfig, setStyleConfig] = useState(DEFAULT_STYLE);
  const [scriptMode, setScriptMode] = useState("telugu"); // 'telugu' | 'romanized'
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [activeTab, setActiveTab] = useState("transcript"); // Default to 'transcript' so segments are immediately visible!
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [asrInfo, setAsrInfo] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [selectedLanguage, setSelectedLanguage] = useState("auto"); // Default to 'auto' (Auto-detect)

  const { user, updateCreditsBalance } = useAuth();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);
  const [guestAction, setGuestAction] = useState("download_video");

  // Fetch active ASR provider status & handle post-login action on mount
  useEffect(() => {
    fetch("/api/transcribe")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setAsrInfo(data);
      })
      .catch(err => console.warn("Could not query ASR status:", err));

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const resume = urlParams.get("resumeAction") || sessionStorage.getItem("tc_pending_guest_action");
      if (resume) {
        sessionStorage.removeItem("tc_pending_guest_action");
        if (resume === "download_video" || resume === "download_srt") {
          setActiveTab("export");
        } else if (resume === "translate") {
          setActiveTab("transcript");
        }
      }
    }
  }, []);

  // Load Built-in Demo Reel Sample
  const handleLoadDemo = () => {
    setVideoSrc(SAMPLE_PROJECT.videoUrl);
    setVideoFilename(SAMPLE_PROJECT.filename);
    setCurrentFile(null);
    setSegments(SAMPLE_PROJECT.segments);
    setDuration(SAMPLE_PROJECT.durationSec);
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveTab("transcript"); // Keep transcript tab active so segments are in full view
    setScriptMode("telugu");
  };

  // Reset Video
  const handleResetVideo = () => {
    if (videoSrc && videoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setCurrentFile(null);
    setSegments([]);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Run transcription API call for both guest trial and credit-deducted users
  const executeTranscriptionApi = async ({ file, lang, durationSec, objectUrl }) => {
    setVideoSrc(objectUrl);
    setVideoFilename(file.name);
    setCurrentFile(file);
    setIsTranscribing(true);

    try {
      const targetLang = lang || "auto";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", targetLang);
      formData.append("duration", String(durationSec));

      if (typeof window !== "undefined" && window.__cf_turnstile_token) {
        formData.append("cf-turnstile-response", window.__cf_turnstile_token);
      }

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.ok && data.segments && data.segments.length > 0) {
        setSegments(data.segments);
        const lastSeg = data.segments[data.segments.length - 1];
        if (lastSeg) setDuration(lastSeg.end + 1);

        const hasTelugu = data.segments.some(s => /[\u0C00-\u0C7F]/.test(s.text));
        setScriptMode(hasTelugu ? "both" : "romanized");

        if (data.creditsRemaining !== undefined && updateCreditsBalance) {
          updateCreditsBalance(data.creditsRemaining);
        }
      } else {
        if (data.code === "GUEST_LIMIT_REACHED" || data.code === "IP_LIMIT_REACHED") {
          setGuestAction("download_video");
          setGuestAuthOpen(true);
        } else if (data.error) {
          alert(data.error);
        }
        setSegments(SAMPLE_PROJECT.segments);
        setScriptMode("telugu");
      }
    } catch (err) {
      console.warn("Transcription API error, loading standard segments:", err);
      setSegments(SAMPLE_PROJECT.segments);
      setScriptMode("telugu");
    } finally {
      setIsTranscribing(false);
      setActiveTab("transcript");
      setPendingAction(null);
    }
  };

  // Handle User Uploaded File with selected language: inspect duration & prompt confirmation
  const handleFileSelected = (file, lang = selectedLanguage) => {
    // 1. Check file size
    const maxSizeBytes = PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (!user && file.size > maxSizeBytes) {
      alert(`File size exceeds the ${PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_FILE_SIZE_MB}MB free guest trial limit. Sign in to process larger files!`);
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

      // 2. Check 2-minute video limit for guest trials
      if (!user && validDur > PRICING_RULES.GUEST_TRIAL_LIMITS.MAX_VIDEO_DURATION_SEC) {
        alert("Free guest trials are limited to 2 minutes maximum. Sign in to process longer videos!");
        return;
      }

      // If anonymous guest trial, run immediately without credit deduction modal
      if (!user) {
        executeTranscriptionApi({ file, lang, durationSec: validDur, objectUrl });
        return;
      }

      // Logged-in user: show credit cost modal
      const cost = PRICING_RULES.calculateCaptionCost(validDur);
      setPendingAction({
        file,
        lang,
        durationSec: validDur,
        cost,
        objectUrl
      });
      setCostModalOpen(true);
    };

    tempVideo.onloadedmetadata = () => {
      triggerProcess(tempVideo.duration);
    };

    tempVideo.onerror = () => {
      triggerProcess(30);
    };

    // Timeout safety
    setTimeout(() => {
      if (!triggered) {
        triggerProcess(30);
      }
    }, 1200);
  };

  // Execute transcription after user confirms credit cost
  const confirmTranscription = () => {
    if (!pendingAction) return;
    setCostModalOpen(false);
    executeTranscriptionApi(pendingAction);
  };

  // Handle Re-transcribe action with credit verification
  const handleRetranscribe = async (lang = selectedLanguage) => {
    if (!user) {
      setGuestAction("download_video");
      setGuestAuthOpen(true);
      return;
    }
    if (!currentFile && !videoSrc) return;
    const durSec = duration || 30;
    const cost = PRICING_RULES.calculateCaptionCost(durSec);

    setPendingAction({
      isRetranscribe: true,
      lang,
      durationSec: durSec,
      cost
    });
    setCostModalOpen(true);
  };

  const confirmRetranscribe = async () => {
    if (!pendingAction) return;
    const { lang, durationSec } = pendingAction;
    setCostModalOpen(false);
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append("language", lang || "auto");
      formData.append("duration", String(durationSec || duration || 30));

      if (currentFile) {
        formData.append("file", currentFile);
      } else {
        const vRes = await fetch(videoSrc);
        const blob = await vRes.blob();
        formData.append("file", blob, videoFilename);
      }

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.ok && data.segments && data.segments.length > 0) {
        setSegments(data.segments);
        const lastSeg = data.segments[data.segments.length - 1];
        if (lastSeg) setDuration(lastSeg.end + 1);

        const hasTelugu = data.segments.some(s => /[\u0C00-\u0C7F]/.test(s.text));
        setScriptMode(hasTelugu ? "both" : "romanized");

        if (data.creditsRemaining !== undefined && updateCreditsBalance) {
          updateCreditsBalance(data.creditsRemaining);
        }
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.warn("Re-transcription failed:", err);
    } finally {
      setIsTranscribing(false);
      setPendingAction(null);
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${theme === "dark" ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-900"}`}>
      {/* Sleek Fixed Navbar - zero wasted space */}
      <Navbar
        hasVideo={!!videoSrc}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadDemo={handleLoadDemo}
        onResetVideo={handleResetVideo}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {!videoSrc ? (
          // Ingestion Screen
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
          // Two-Column Studio Layout with guaranteed full-height fit
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-2.5 sm:p-3 overflow-hidden h-full">
            {/* Left 5 Columns: Video Viewport & Playback Stage */}
            <div className="lg:col-span-5 xl:col-span-5 h-full min-h-0 flex flex-col overflow-hidden">
              <VideoStage
                videoSrc={videoSrc}
                segments={segments}
                styleConfig={styleConfig}
                scriptMode={scriptMode}
                setScriptMode={setScriptMode}
                showSafeZone={showSafeZone}
                setShowSafeZone={setShowSafeZone}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                setDuration={setDuration}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
              />
            </div>

            {/* Right 7 Columns: Studio Workstation (Transcript / Styles / Export) */}
            <div className="lg:col-span-7 xl:col-span-7 h-full min-h-0 flex flex-col overflow-hidden">
              {activeTab === "transcript" && (
                <TranscriptEditor
                  segments={segments}
                  setSegments={setSegments}
                  currentTime={currentTime}
                  onSeek={(time) => setCurrentTime(time)}
                  scriptMode={scriptMode}
                  setScriptMode={setScriptMode}
                  isTranscribing={isTranscribing}
                  asrInfo={asrInfo}
                  onRetranscribe={handleRetranscribe}
                  isPlaying={isPlaying}
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                />
              )}

              {activeTab === "style" && (
                <StyleCustomizer
                  styleConfig={styleConfig}
                  setStyleConfig={setStyleConfig}
                />
              )}

              {activeTab === "export" && (
                <ExportModal
                  segments={segments}
                  scriptMode={scriptMode}
                  videoSrc={videoSrc}
                  styleConfig={styleConfig}
                  filename={videoFilename}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Credit Pre-Confirmation Modal */}
      <CreditCostModal
        isOpen={costModalOpen}
        onClose={() => { setCostModalOpen(false); setPendingAction(null); }}
        onConfirm={pendingAction?.isRetranscribe ? confirmRetranscribe : confirmTranscription}
        cost={pendingAction?.cost || 1}
        currentBalance={user?.credits_balance ?? 100}
        durationSec={pendingAction?.durationSec}
        actionTitle={pendingAction?.isRetranscribe ? "Re-transcribe Video" : "Generate ManaCaptions"}
        description="Speech recognition & synchronized word-level karaoke timestamps."
      />

      {/* Guest Trial Sign In Modal */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType={guestAction}
        onSuccess={() => {
          if (guestAction === "download_video" || guestAction === "download_srt") {
            setActiveTab("export");
          } else if (guestAction === "translate") {
            setActiveTab("transcript");
          }
        }}
      />
    </div>
  );
}

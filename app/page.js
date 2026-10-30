"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  Zap,
  Film,
  Video,
  Play,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Languages,
  Clock,
  Star,
  Flame,
  LayoutDashboard,
  LogIn,
  ChevronRight,
  Heart,
  MessageSquare
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Interactive Live Reel Subtitle Demo state
  const [activeScript, setActiveScript] = useState("telugu"); // "telugu" | "romanized"
  const [activeStyle, setActiveStyle] = useState("hormozi"); // "hormozi" | "karaoke" | "neon" | "cinematic"
  const [currentWordIdx, setCurrentWordIdx] = useState(1);

  // Simulated subtitle phrases
  const demoTeluguPhrases = [
    { text: "మన", time: "0.2s" },
    { text: "వీడియోలకు", time: "0.6s" },
    { text: "క్యాప్షన్స్", time: "1.1s" },
    { text: "ఉంటే", time: "1.5s" },
    { text: "రీచ్", time: "1.9s" },
    { text: "డబుల్", time: "2.3s" },
    { text: "అవుతుంది!", time: "2.8s" }
  ];

  const demoRomanizedPhrases = [
    { text: "Mana", time: "0.2s" },
    { text: "videolaku", time: "0.6s" },
    { text: "captions", time: "1.1s" },
    { text: "unte", time: "1.5s" },
    { text: "reach", time: "1.9s" },
    { text: "double", time: "2.3s" },
    { text: "avuthundi!", time: "2.8s" }
  ];

  // Auto-cycle words in mock demo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIdx((prev) => (prev + 1) % demoTeluguPhrases.length);
    }, 650);
    return () => clearInterval(interval);
  }, [demoTeluguPhrases.length]);

  return (
    <div className="min-h-screen w-full bg-[#060919] text-[#F8F3F0] flex flex-col selection:bg-[#20309A] selection:text-[#F8F3F0] relative overflow-x-hidden">
      
      {/* =========================================================================
          BACKGROUND MOTION GRAPHICS & GLOWING AMBIENT PARTICLES
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Center Royal Blue Halo */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#20309A]/20 rounded-full blur-[140px] animate-pulse duration-1000" />
        
        {/* Gopuram Crimson Orb Left */}
        <div className="absolute top-[25%] -left-32 w-[500px] h-[500px] bg-[#BB232B]/12 rounded-full blur-[130px]" />
        
        {/* Electric Indigo Orb Right */}
        <div className="absolute top-[45%] -right-32 w-[600px] h-[600px] bg-[#384DE8]/12 rounded-full blur-[150px]" />
        
        {/* Bottom Ambient Glow */}
        <div className="absolute bottom-0 left-1/3 w-[800px] h-[400px] bg-[#20309A]/15 rounded-full blur-[160px]" />

        {/* Subtle Geometric Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#20309A08_1px,transparent_1px),linear-gradient(to_bottom,#20309A08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="h-16 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#070A1E] border border-[#20309A]/60 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(32,48,154,0.4)] group-hover:scale-105 transition-all">
            <img src="/logo-icon.png" alt="ManaCaptions Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[#F8F3F0] text-lg sm:text-xl tracking-tight">
                Mana<span className="text-[#E0353E]">Captions</span>
              </span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 font-bold shadow-[0_0_10px_rgba(187,35,43,0.3)]">
                AI
              </span>
            </div>
            <span className="text-[10px] text-[#F8F3F0]/60 hidden sm:inline -mt-1 font-medium">
              Telugu Captions. Made Easy.
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#F8F3F0]/80">
          <Link href="/studio" className="hover:text-white transition-colors flex items-center gap-1">
            <Film className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Studio</span>
          </Link>
          <Link href="/pricing" className="hover:text-white transition-colors flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#BB232B]" />
            <span>Pricing &amp; Packs</span>
          </Link>
          <Link href="/support" className="hover:text-white transition-colors flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Support</span>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] border border-[#20309A]/40 text-xs font-bold transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#384DE8]" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] border border-[#20309A]/40 text-xs font-bold transition-all hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5 text-[#384DE8]" />
              <span>Sign In</span>
            </Link>
          )}

          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(32,48,154,0.4)] hover:scale-105 cursor-pointer"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1: HERO SHOWCASE (WITH MOTION BADGES & INTERACTIVE DEMO)
          ========================================================================= */}
      <section className="relative z-10 pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Floating Animated Badges (Left & Right) */}
        <div className="hidden lg:block absolute left-8 top-32 animate-bounce duration-1000">
          <div className="px-3.5 py-2 rounded-2xl bg-[#0C1230]/80 border border-[#20309A]/50 text-xs font-bold text-[#F8F3F0] backdrop-blur-md shadow-[0_10px_25px_rgba(32,48,154,0.3)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>బాగున్నారా ఫ్రెండ్స్? 👋</span>
          </div>
        </div>

        <div className="hidden lg:block absolute right-8 top-36 animate-bounce duration-1000 delay-300">
          <div className="px-3.5 py-2 rounded-2xl bg-[#0C1230]/80 border border-[#BB232B]/50 text-xs font-bold text-[#F8F3F0] backdrop-blur-md shadow-[0_10px_25px_rgba(187,35,43,0.3)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0353E] animate-pulse" />
            <span>Meeru ee reel chusara? 🔥</span>
          </div>
        </div>

        {/* Hero Top Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#181A24] border border-[#2B2F42] text-[11px] font-bold text-[#E5C583] uppercase tracking-wider mb-4 shadow-sm">
          <span>FOR REELS AND SHORTS</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl">
          Content studio for{" "}
          <span className="bg-gradient-to-r from-[#F3E8CE] via-[#E5C583] to-[#D4AF37] bg-clip-text text-transparent">
            Desi creators
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base text-[#9A9DAE] max-w-2xl leading-relaxed font-normal">
          Built for Telugu first: Tanglish or తెలుగు, auto-transcription, title, caption, hashtags and thumbnail preview in seconds.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/studio"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(32,48,154,0.5)] flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
            <span>Get Started with 10 Free Credits &rarr;</span>
          </Link>

          <Link
            href="/pricing"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] border border-[#20309A]/50 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:border-[#384DE8]/60"
          >
            <Zap className="w-4 h-4 text-[#BB232B] fill-[#BB232B]" />
            <span>View Royal Pricing</span>
          </Link>
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#F8F3F0]/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Free Subtitle (SRT/VTT) Exports</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Telugu + Romanized Script</span>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE REEL SUBTITLE PREVIEWER (MOCK SMARTPHONE STAGE)
            ========================================================================= */}
        <div className="mt-14 w-full max-w-xl mx-auto">
          <div className="rounded-3xl border-2 border-[#20309A]/40 bg-[#0B102B]/80 backdrop-blur-2xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative group">
            
            {/* Top Interactive Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-[#20309A]/30">
              {/* Script Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-[#060919] border border-[#20309A]/40 text-xs">
                <button
                  onClick={() => setActiveScript("telugu")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeScript === "telugu"
                      ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-white shadow-sm"
                      : "text-[#F8F3F0]/60 hover:text-white"
                  }`}
                >
                  తెలుగు (Native)
                </button>
                <button
                  onClick={() => setActiveScript("romanized")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeScript === "romanized"
                      ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-white shadow-sm"
                      : "text-[#F8F3F0]/60 hover:text-white"
                  }`}
                >
                  English Translit
                </button>
              </div>

              {/* Style Presets */}
              <div className="flex items-center gap-1.5 text-[11px]">
                {[
                  { id: "hormozi", name: "Hormozi" },
                  { id: "karaoke", name: "Karaoke" },
                  { id: "neon", name: "Neon Glow" },
                  { id: "cinematic", name: "Cinematic" }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStyle(s.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeStyle === s.id
                        ? "bg-[#384DE8]/20 border border-[#384DE8] text-white font-bold"
                        : "text-[#F8F3F0]/50 hover:text-white"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Canvas Stage */}
            <div className="relative aspect-[9/10] sm:aspect-[9/11] rounded-2xl bg-gradient-to-b from-[#101742] via-[#0C1230] to-[#1C0D26] overflow-hidden flex flex-col items-center justify-center p-6 border border-[#20309A]/40 shadow-inner">
              
              {/* Background Reel Lighting Simulation */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(56,77,232,0.25),transparent_60%)]" />
              
              {/* Creator Watermark Mock */}
              <div className="absolute top-4 left-4 flex items-center gap-2 text-[11px] text-[#F8F3F0]/60">
                <div className="w-5 h-5 rounded-full bg-[#BB232B] flex items-center justify-center font-bold text-[9px] text-white">
                  MC
                </div>
                <span>@telugu.creator.reels</span>
              </div>

              {/* Right Side Social Bar Mock */}
              <div className="absolute right-4 bottom-16 flex flex-col items-center gap-3 text-xs text-[#F8F3F0]/70">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-red-500">
                    <Heart className="w-4 h-4 fill-red-500" />
                  </div>
                  <span className="text-[10px] font-bold">142K</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="text-[10px] font-bold">Share</span>
                </div>
              </div>

              {/* LIVE ACTIVE SUBTITLE DISPLAY */}
              <div className="relative z-10 max-w-sm text-center px-4 py-8">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(activeScript === "telugu" ? demoTeluguPhrases : demoRomanizedPhrases).map((phrase, idx) => {
                    const isActive = idx === currentWordIdx;
                    return (
                      <span
                        key={idx}
                        className={`transition-all duration-150 inline-block px-1.5 py-0.5 rounded-lg select-none font-black tracking-tight ${
                          isActive
                            ? activeStyle === "hormozi"
                              ? "bg-amber-400 text-black text-2xl sm:text-3xl scale-110 shadow-[0_0_20px_rgba(251,191,36,0.6)] rotate-[-2deg]"
                              : activeStyle === "neon"
                              ? "text-cyan-300 text-2xl sm:text-3xl drop-shadow-[0_0_15px_rgba(103,232,249,0.9)] scale-110"
                              : activeStyle === "karaoke"
                              ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-white text-2xl sm:text-3xl scale-110 shadow-lg"
                              : "text-white text-2xl sm:text-3xl underline decoration-[#E0353E] decoration-4"
                            : "text-white/60 text-xl sm:text-2xl"
                        }`}
                      >
                        {phrase.text}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Reel Audio Wave Bar */}
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] text-[#F8F3F0]/50 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Active Karaoke Sync</span>
                </div>
                <span>1080p 60fps</span>
              </div>
            </div>

            <p className="text-[11px] text-center text-[#F8F3F0]/50 mt-3">
              Live Interactive Preview · Click presets above to test styles
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WHY TELUGU CREATORS SWITCH TO MANACAPTIONS
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#20309A]/30">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BB232B]/20 border border-[#BB232B]/40 text-xs font-bold text-[#F8F3F0]">
            <Flame className="w-3.5 h-3.5 text-[#E0353E]" />
            <span>The Telugu Creator Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8F3F0] tracking-tight">
            Why Other Caption Apps Fail at Telugu
          </h2>
          <p className="text-xs sm:text-sm text-[#F8F3F0]/70">
            CapCut, Veed, and foreign apps were built for English. ManaCaptions was engineered from the ground up for Telugu phonetic speech.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-[#0B102B]/70 border border-[#20309A]/40 backdrop-blur-md space-y-3 shadow-lg hover:border-[#384DE8] transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-[#20309A]/20 border border-[#20309A]/50 flex items-center justify-center text-[#384DE8]">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dual-Script Transliteration</h3>
            <p className="text-xs text-[#F8F3F0]/70 leading-relaxed">
              Foreign apps give you translated English or broken font glyphs. ManaCaptions generates both authentic Telugu script and phonetic Romanized slang that resonates with gen-Z audiences.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-[#0B102B]/70 border border-[#20309A]/40 backdrop-blur-md space-y-3 shadow-lg hover:border-[#BB232B] transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-[#BB232B]/20 border border-[#BB232B]/50 flex items-center justify-center text-[#E0353E]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Free Subtitle Exports & Rapid Video</h3>
            <p className="text-xs text-[#F8F3F0]/70 leading-relaxed">
              Other tools charge you an export penalty or place watermarks. With ManaCaptions, high-resolution SRT downloads are 100% free, and MP4 rendering is fast and effortless.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-[#0B102B]/70 border border-[#20309A]/40 backdrop-blur-md space-y-3 shadow-lg hover:border-[#E5A93C] transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-[#E5A93C]/20 border border-[#E5A93C]/50 flex items-center justify-center text-[#E5A93C]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Telugu Dialect Speech Engine</h3>
            <p className="text-xs text-[#F8F3F0]/70 leading-relaxed">
              Trained on real conversational Telugu podcasts, tech reviews, comedy reels, and vlogs across Telangana and Andhra Pradesh dialects.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: STEP-BY-STEP WORKFLOW
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-8 max-w-5xl mx-auto border-t border-[#20309A]/30">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8F3F0] tracking-tight">
            How It Works in 3 Quick Steps
          </h2>
          <p className="text-xs sm:text-sm text-[#F8F3F0]/70">
            From raw video file to viral ready Reel in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="p-6 rounded-3xl bg-[#0C1230]/70 border border-[#20309A]/40 space-y-3">
            <div className="text-3xl font-black text-[#384DE8]">01</div>
            <h3 className="text-base font-bold text-white">Upload Short or Reel</h3>
            <p className="text-xs text-[#F8F3F0]/65 leading-relaxed">
              Drop any MP4, MOV, or WebM video up to 2 minutes. Our fast cloud pipeline slices and ingests audio instantly.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0C1230]/70 border border-[#20309A]/40 space-y-3">
            <div className="text-3xl font-black text-[#E0353E]">02</div>
            <h3 className="text-base font-bold text-white">AI Generates Captions</h3>
            <p className="text-xs text-[#F8F3F0]/65 leading-relaxed">
              Gemini &amp; Groq neural models recognize every Telugu syllable, apply timestamps, and generate Dual-Script subtitles.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0C1230]/70 border border-[#20309A]/40 space-y-3">
            <div className="text-3xl font-black text-amber-400">03</div>
            <h3 className="text-base font-bold text-white">Pick Style &amp; Export</h3>
            <p className="text-xs text-[#F8F3F0]/65 leading-relaxed">
              Choose Hormozi, Neon, or Karaoke style. Burn-in 1080p video with animated presets and post straight to Instagram!
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CALL TO ACTION TEASER
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-8 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0D1438] via-[#0C1230] to-[#1E0D28] border-2 border-[#20309A]/50 shadow-[0_0_50px_rgba(32,48,154,0.3)] space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#060919] border border-[#20309A]/60 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(32,48,154,0.4)]">
            <img src="/logo-icon.png" alt="ManaCaptions Logo" className="w-12 h-12 object-contain" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Multiply Your <span className="text-[#E0353E]">Reel Views</span>?
          </h2>

          <p className="text-xs sm:text-base text-[#F8F3F0]/70 max-w-lg mx-auto">
            Join thousands of Telugu creators creating viral dual-script captions today. Sign in with Google and claim your 10 Free Credits.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/studio"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-black text-sm shadow-[0_0_25px_rgba(32,48,154,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              Open Studio Now (Free) &rarr;
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] border border-[#20309A]/50 font-bold text-xs transition-all"
            >
              View Credit Packages
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          WORLD-CLASS ANIMATED FOOTER
          ========================================================================= */}
      <footer className="relative z-10 border-t border-[#20309A]/30 bg-[#060919]/95 backdrop-blur-xl py-12 px-4 sm:px-8 text-xs text-[#F8F3F0]/60">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#070A1E] border border-[#20309A]/60 flex items-center justify-center p-1 shadow-md">
                <img src="/logo-icon.png" alt="ManaCaptions Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-[#F8F3F0] text-base tracking-tight">
                  Mana<span className="text-[#E0353E]">Captions</span>
                </span>
                <span className="block text-[10px] text-[#F8F3F0]/60 font-medium">
                  Telugu Captions. Made Easy.
                </span>
              </div>
            </div>
            <p className="text-xs text-[#F8F3F0]/60 leading-relaxed max-w-sm">
              The premier AI speech and auto-caption suite engineered for Telugu content creators, meme pages, YouTubers, and digital agencies.
            </p>
            <div className="text-[11px] text-[#F8F3F0]/50 pt-1">
              Built with <Heart className="w-3 h-3 inline text-[#E0353E] fill-[#E0353E] mx-1" /> for Telugu Creators worldwide.
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-[#F8F3F0] uppercase tracking-wider text-[#384DE8]">
              Platform Studio
            </h4>
            <ul className="space-y-1.5 text-xs text-[#F8F3F0]/70">
              <li>
                <Link href="/studio" className="hover:text-white transition-colors">Studio Video Editor</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">Creator Dashboard</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">Credit Pricing &amp; Top-Ups</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Google Sign-In / Account</Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-bold text-[#F8F3F0] uppercase tracking-wider text-[#BB232B]">
              Creator Care &amp; Support
            </h4>
            <ul className="space-y-1.5 text-xs text-[#F8F3F0]/70">
              <li>
                <Link href="/support" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-[#384DE8]" />
                  <span>Support &amp; Inquiry Helpdesk</span>
                </Link>
              </li>
              <li>
                <a href="mailto:hello.trygaruda@gmail.com" className="hover:text-white transition-colors">
                  hello.trygaruda@gmail.com
                </a>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-[#20309A]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#F8F3F0]/40">
          <span>&copy; {new Date().getFullYear()} ManaCaptions Studio. All rights reserved.</span>
          <span>100% Safe &amp; Secure Cloud Transcription</span>
        </div>
      </footer>
    </div>
  );
}

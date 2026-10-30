"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Film,
  Plus,
  Play,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
  LogOut,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Video,
  Languages,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  LogIn
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, projects, deleteProject } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || p.aspectRatio === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCreateNew = () => {
    router.push("/studio");
  };

  const handleOpenProject = (project) => {
    router.push("/studio");
  };

  return (
    <div className="min-h-screen w-full bg-[#060919] text-[#F8F3F0] flex flex-col selection:bg-[#20309A] selection:text-[#F8F3F0]">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#070A1E] border border-[#20309A]/60 flex items-center justify-center p-1 shadow-[0_0_15px_rgba(32,48,154,0.4)] group-hover:scale-105 transition-all">
              <img src="/logo-icon.png" alt="ManaCaptions Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#F8F3F0] text-base tracking-tight">
                Mana<span className="text-[#E0353E]">Captions</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 font-bold shadow-[0_0_10px_rgba(187,35,43,0.3)]">
                Dashboard
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#20309A]/30">
            <Link
              href="/studio"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-[#F8F3F0]/80 hover:text-white hover:bg-[#0D1333] border border-transparent hover:border-[#20309A]/40 transition-all flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-[#384DE8]" />
              <span>Studio Editor</span>
            </Link>

            <Link
              href="/pricing"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-[#F8F3F0]/80 hover:text-white hover:bg-[#0D1333] border border-transparent hover:border-[#BB232B]/40 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#BB232B] fill-[#BB232B]" />
              <span>Pricing</span>
            </Link>
          </div>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-3">
          {!user ? (
            <Link
              href="/studio"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20309A] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-[#F8F3F0] text-xs font-bold shadow-[0_0_15px_rgba(32,48,154,0.4)] transition-all cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F8F3F0]" />
              <span>Try It Free</span>
            </Link>
          ) : (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20309A] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-[#F8F3F0] text-xs font-bold shadow-[0_0_18px_rgba(187,35,43,0.35)] transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Caption Reel</span>
            </button>
          )}

          {user && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] border border-[#BB232B]/40 hover:border-[#BB232B] text-[#F8F3F0] text-xs font-bold shadow-[0_0_12px_rgba(187,35,43,0.2)] transition-all"
              title="Top Up Credits"
            >
              <Zap className="w-3.5 h-3.5 text-[#BB232B] fill-[#BB232B]" />
              <span>{user?.credits_balance ?? 10} credits</span>
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#0D1333] border border-transparent hover:border-[#20309A]/40 transition-all cursor-pointer"
              >
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                  alt={user?.name || "User"}
                  className="w-8 h-8 rounded-xl object-cover border border-[#20309A]/60 shadow-[0_0_10px_rgba(32,48,154,0.4)]"
                />
                <span className="hidden md:inline text-xs font-semibold text-[#F8F3F0]">
                  {user?.name || "Creator"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#F8F3F0]/60" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090D26] border border-[#20309A]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(32,48,154,0.3)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                  <div className="p-2.5 border-b border-[#20309A]/30 mb-1">
                    <p className="text-xs font-bold text-[#F8F3F0] truncate">{user?.name || "Telugu Creator"}</p>
                    <p className="text-[11px] text-[#F8F3F0]/60 truncate">{user?.email || "creator@gmail.com"}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] font-bold border border-[#BB232B]/40">
                      {user?.plan || "Creator Pro"}
                    </span>
                  </div>

                  <Link
                    href="/studio"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#F8F3F0]/80 hover:text-white hover:bg-[#101742] transition-colors"
                  >
                    <Video className="w-4 h-4 text-[#384DE8]" />
                    <span>Open Video Studio</span>
                  </Link>

                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#F8F3F0]/80 hover:text-white hover:bg-[#101742] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#BB232B] fill-[#BB232B]" />
                    <span>Buy Credits</span>
                  </Link>

                  <Link
                    href="/support"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#F8F3F0]/80 hover:text-white hover:bg-[#101742] transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#384DE8]" />
                    <span>Support &amp; Help</span>
                  </Link>



                  <button
                    onClick={() => { logout(); router.push("/login"); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#E0353E] hover:bg-[#BB232B]/15 transition-colors cursor-pointer text-left mt-1 border-t border-[#20309A]/30 pt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] font-bold text-xs border border-[#20309A]/50 transition-all hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5 text-[#384DE8]" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Dashboard Body - Clean natural scrolling */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Welcome Greeting & Futuristic Royal Hero Banner */}
        <div className="relative rounded-3xl border border-[#20309A]/40 bg-gradient-to-r from-[#0C1230] via-[#090D24] to-[#140D24] p-6 sm:p-10 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(32,48,154,0.15)]">
          {/* Glowing Radial Orbs */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#20309A]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#BB232B]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20309A]/30 border border-[#20309A]/60 text-[#F8F3F0] text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#384DE8]" />
                <span>Namaskaram, {user?.name?.split(" ")[0] || "Creator"} 👋</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-[#F8F3F0] tracking-tight leading-tight">
                Your <span className="bg-gradient-to-r from-[#384DE8] via-[#F8F3F0] to-[#E0353E] bg-clip-text text-transparent">ManaCaption</span> Studio
              </h1>
              <p className="text-[#F8F3F0]/70 text-xs sm:text-sm max-w-xl leading-relaxed">
                Produce viral dual-script Telugu subtitles, sync song lyrics with Google Gemini 2.5 Flash, and export ready-to-post 9:16 reels in seconds.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!user ? (
                <Link
                  href="/studio"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-[#F8F3F0] font-extrabold text-xs sm:text-sm shadow-[0_0_25px_rgba(32,48,154,0.5)] flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Try It Free</span>
                </Link>
              ) : (
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-[#F8F3F0] font-extrabold text-xs sm:text-sm shadow-[0_0_25px_rgba(187,35,43,0.4)] flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Reel Project</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4 Usage Analytics & Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reels */}
          <div className="p-5 rounded-2xl border border-[#20309A]/30 bg-[#0C1230]/70 backdrop-blur-md space-y-3 hover:border-[#384DE8]/60 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between text-[#F8F3F0]/70 text-xs">
              <span className="font-medium">Total Reels Captioned</span>
              <div className="w-8 h-8 rounded-xl bg-[#20309A]/20 flex items-center justify-center text-[#384DE8] border border-[#20309A]/40">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#F8F3F0]">24 Reels</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+18% from last week</span>
              </div>
            </div>
          </div>

          {/* Card 2: Audio Transcribed */}
          <div className="p-5 rounded-2xl border border-[#20309A]/30 bg-[#0C1230]/70 backdrop-blur-md space-y-3 hover:border-[#384DE8]/60 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between text-[#F8F3F0]/70 text-xs">
              <span className="font-medium">Audio Transcribed</span>
              <div className="w-8 h-8 rounded-xl bg-[#BB232B]/20 flex items-center justify-center text-[#E0353E] border border-[#BB232B]/40">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#F8F3F0]">48.5 Mins</div>
              <div className="text-[11px] text-[#F8F3F0]/60 mt-1">
                131.5 mins left in monthly quota
              </div>
            </div>
          </div>

          {/* Card 3: Active AI Engine */}
          <div className="p-5 rounded-2xl border border-[#20309A]/30 bg-[#0C1230]/70 backdrop-blur-md space-y-3 hover:border-[#384DE8]/60 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between text-[#F8F3F0]/70 text-xs">
              <span className="font-medium">Primary AI Engine</span>
              <div className="w-8 h-8 rounded-xl bg-[#20309A]/25 flex items-center justify-center text-[#384DE8] border border-[#20309A]/50">
                <Zap className="w-4 h-4 fill-[#384DE8]" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#384DE8] truncate">
                Gemini 2.5 Flash
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#F8F3F0]/70 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#E0353E] animate-pulse" />
                <span>Song Lyrics &amp; Telugu Active</span>
              </div>
            </div>
          </div>

          {/* Card 4: Subtitle Virality Boost */}
          <div className="p-5 rounded-2xl border border-[#20309A]/30 bg-[#0C1230]/70 backdrop-blur-md space-y-3 hover:border-[#BB232B]/60 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between text-[#F8F3F0]/70 text-xs">
              <span className="font-medium">Avg. Engagement Boost</span>
              <div className="w-8 h-8 rounded-xl bg-[#BB232B]/20 flex items-center justify-center text-[#E0353E] border border-[#BB232B]/40">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#F8F3F0]">+280%</div>
              <div className="text-[11px] text-[#F8F3F0]/60 mt-1">
                Karaoke highlight watch-time
              </div>
            </div>
          </div>
        </div>

        {/* Projects & Recent Reels Section */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#F8F3F0]">
                Recent Projects &amp; Reels
              </h2>
              <p className="text-xs text-[#F8F3F0]/60">
                Manage your saved drafts, export video files, and reopen subtitles in the studio.
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#F8F3F0]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reels..."
                  className="bg-[#0A0E28] border border-[#20309A]/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/40 focus:outline-none focus:border-[#384DE8] transition-colors w-40 sm:w-56"
                />
              </div>

              <div className="flex items-center bg-[#0A0E28] p-0.5 rounded-xl border border-[#20309A]/40 text-xs">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterType === "all" ? "bg-[#20309A] text-white font-bold shadow-sm" : "text-[#F8F3F0]/60 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("9/16")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterType === "9/16" ? "bg-[#20309A] text-white font-bold shadow-sm" : "text-[#F8F3F0]/60 hover:text-white"
                  }`}
                >
                  9:16 Reels
                </button>
              </div>
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl border border-[#20309A]/30 bg-[#0C1230]/60 hover:bg-[#0F1740] hover:border-[#384DE8]/60 transition-all overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-[0_0_20px_rgba(32,48,154,0.3)] hover:-translate-y-1"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-[16/9] w-full bg-[#050816] overflow-hidden cursor-pointer" onClick={() => handleOpenProject(project)}>
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060919] via-transparent to-black/20" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#20309A] to-[#BB232B] text-white flex items-center justify-center shadow-[0_0_20px_rgba(187,35,43,0.5)]">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[#F8F3F0] font-bold border border-white/10">
                      {project.aspectRatio === "9/16" ? "9:16 Reel" : project.aspectRatio}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-[#F8F3F0]/80">
                    {project.duration}s
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => handleOpenProject(project)}
                      className="font-bold text-sm text-[#F8F3F0] hover:text-[#384DE8] transition-colors cursor-pointer line-clamp-1"
                    >
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#F8F3F0]/60">
                      <span>{project.language}</span>
                      <span>•</span>
                      <span>{project.segmentsCount} segments</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#20309A]/20 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[#F8F3F0]/50">
                      Edited {project.date}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenProject(project)}
                        title="Open in Studio Editor"
                        className="p-1.5 rounded-lg hover:bg-[#151E50] text-[#F8F3F0]/70 hover:text-[#384DE8] transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteProject(project.id)}
                        title="Delete Project"
                        className="p-1.5 rounded-lg hover:bg-[#BB232B]/20 text-[#F8F3F0]/50 hover:text-[#E0353E] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Upload New Card */}
            <div
              onClick={handleCreateNew}
              className="rounded-2xl border-2 border-dashed border-[#20309A]/40 hover:border-[#BB232B] bg-[#0C1230]/30 hover:bg-[#20309A]/10 p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#080C22] border border-[#20309A]/50 group-hover:border-[#BB232B] flex items-center justify-center group-hover:scale-110 transition-all shadow-md">
                <Plus className="w-6 h-6 text-[#384DE8] group-hover:text-[#BB232B]" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#F8F3F0] group-hover:text-[#BB232B] transition-colors">
                  Create New Caption Reel
                </p>
                <p className="text-[11px] text-[#F8F3F0]/50 mt-0.5">
                  Drop a Short or Reel to generate captions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#20309A]/30 bg-[#060919] px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F8F3F0]/60 gap-4 mt-12">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="ManaCaptions" className="w-5 h-5 object-contain" />
          <span className="font-bold text-[#F8F3F0]">ManaCaptions</span>
          <span>· Telugu Captions. Made Easy.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/studio" className="hover:text-[#384DE8] transition-colors">Studio</Link>
          <span>•</span>
          <Link href="/pricing" className="hover:text-[#BB232B] transition-colors">Pricing</Link>
          <span>•</span>
          <Link href="/support" className="hover:text-[#384DE8] transition-colors">Support</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-[#F8F3F0] transition-colors">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#F8F3F0] transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/login" className="hover:text-[#F8F3F0] transition-colors">Switch Account</Link>
        </div>
      </footer>
    </div>
  );
}

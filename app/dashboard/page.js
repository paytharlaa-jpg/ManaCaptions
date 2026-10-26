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
  Download,
  Copy,
  ChevronDown,
  LogIn
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, projects, deleteProject, addProject } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | '9/16' | '1/1' | '16/9'
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Filter projects based on search and aspect ratio
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
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-xs group-hover:scale-105 transition-transform">
              MC
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">ManaCaptions</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold">
                Dashboard
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-neutral-800">
            <Link
              href="/studio"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-orange-400" />
              <span>Studio Editor</span>
            </Link>
          </div>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-3">
          {!user ? (
            <Link
              href="/studio"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try It Free</span>
            </Link>
          ) : (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>New Caption Reel</span>
            </button>
          )}

          {/* User Profile Avatar & Dropdown / Sign In CTA */}
          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-orange-400" />
              <span>{user?.credits_balance ?? 100} credits</span>
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all cursor-pointer"
              >
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                  alt={user?.name || "User"}
                  className="w-8 h-8 rounded-lg object-cover border border-orange-500/40"
                />
                <span className="hidden md:inline text-xs font-semibold text-white">
                  {user?.name || "Creator"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-neutral-800 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user?.name || "Telugu Creator"}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{user?.email || "creator@gmail.com"}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      {user?.plan || "Creator Pro"}
                    </span>
                  </div>

                  <Link
                    href="/studio"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Video className="w-4 h-4 text-orange-400" />
                    <span>Open Video Studio</span>
                  </Link>

                  <button
                    onClick={() => { logout(); router.push("/login"); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left mt-1 border-t border-neutral-800 pt-2"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-700/80 transition-all hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-400" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        
        {/* Welcome Greeting & Hero Banner */}
        <div className="relative rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-orange-950/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Namaskaram, {user?.name?.split(" ")[0] || "Creator"} 👋</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Your ManaCaptions Studio
              </h1>
              <p className="text-neutral-400 text-xs sm:text-sm max-w-xl">
                Create viral dual-script Telugu subtitles, sync song lyrics with Google Gemini 2.5 Flash, and export ready-to-post 9:16 reels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!user ? (
                <Link
                  href="/studio"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-500/30 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Try It Free</span>
                </Link>
              ) : (
                <button
                  onClick={handleCreateNew}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
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
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-medium">Total Reels Captioned</span>
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">24 Reels</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+18% from last week</span>
              </div>
            </div>
          </div>

          {/* Card 2: Audio Transcribed */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-medium">Audio Transcribed</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">48.5 Mins</div>
              <div className="text-[11px] text-neutral-400 mt-1">
                131.5 mins left in monthly quota
              </div>
            </div>
          </div>

          {/* Card 3: Active AI Engine */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-medium">Primary AI Engine</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate">
                Gemini 2.5 Flash
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Song Lyrics &amp; Telugu Active</span>
              </div>
            </div>
          </div>

          {/* Card 4: Subtitle Virality Boost */}
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-medium">Avg. Engagement Boost</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">+280%</div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Karaoke highlight watch-time
              </div>
            </div>
          </div>
        </div>

        {/* Projects & Recent Reels Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Recent Projects &amp; Reels
              </h2>
              <p className="text-xs text-neutral-400">
                Manage your saved drafts, export video files, and reopen subtitles in the studio.
              </p>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reels..."
                  className="bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors w-40 sm:w-56"
                />
              </div>

              <div className="flex items-center bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 text-xs">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterType === "all" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("9/16")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    filterType === "9/16" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
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
                className="group rounded-2xl border border-neutral-800/90 bg-neutral-900/50 hover:bg-neutral-900/80 hover:border-neutral-700 transition-all overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-[16/9] w-full bg-neutral-950 overflow-hidden cursor-pointer" onClick={() => handleOpenProject(project)}>
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white font-bold border border-white/10">
                      {project.aspectRatio === "9/16" ? "9:16 Reel" : project.aspectRatio}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-neutral-300">
                    {project.duration}s
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => handleOpenProject(project)}
                      className="font-bold text-sm text-white hover:text-orange-400 transition-colors cursor-pointer line-clamp-1"
                    >
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                      <span>{project.language}</span>
                      <span>•</span>
                      <span>{project.segmentsCount} segments</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-neutral-500">
                      Edited {project.date}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenProject(project)}
                        title="Open in Studio Editor"
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-orange-400 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteProject(project.id)}
                        title="Delete Project"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
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
              className="rounded-2xl border-2 border-dashed border-neutral-800 hover:border-orange-500/50 bg-neutral-900/20 hover:bg-orange-500/5 p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 group-hover:border-orange-500/50 flex items-center justify-center group-hover:scale-110 transition-all shadow-md">
                <Plus className="w-6 h-6 text-neutral-400 group-hover:text-orange-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors">
                  Create New Caption Reel
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Drop a Short or Reel to generate captions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* Footer */}
      <footer className="h-12 border-t border-neutral-900 px-6 sm:px-12 flex items-center justify-between text-[11px] text-neutral-500">
        <div>ManaCaptions Studio · Creator Dashboard</div>
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:text-orange-400">Studio</Link>
          <span>•</span>
          <Link href="/login" className="hover:text-orange-400">Switch Account</Link>
        </div>
      </footer>
    </div>
  );
}

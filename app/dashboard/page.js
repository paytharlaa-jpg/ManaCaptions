"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Plus,
  Upload,
  Video,
  ChevronDown,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Image,
  Film,
  LogOut,
  Clock,
  ExternalLink
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, projects } = useAuth();
  const [activeTab, setActiveTab] = useState("inprogress"); // 'inprogress' | 'finished'
  const [activeSidebarNav, setActiveSidebarNav] = useState("reels");
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleNewCaption = () => {
    router.push("/studio");
  };

  return (
    <div className="h-screen w-screen bg-[#0D0E12] text-[#FFFFFF] flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#232634] bg-[#0E0F15] px-4 sm:px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-[#181A24] border border-[#2B2F42] flex items-center justify-center p-0.5">
              <img src="/logo-icon.png" alt="ManaCaptions Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-[#FFFFFF] text-base tracking-tight">
              Mana<span className="text-[#E5C583]">Captions</span>
            </span>
          </Link>

          {/* Top Ticker Notification */}
          <Link
            href="/pricing"
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181A24] hover:bg-[#202330] border border-[#2B2F42] text-[11px] text-[#A6AABF] hover:text-[#FFFFFF] transition-all ml-2"
          >
            <span className="text-[#E5C583] font-semibold">0.5 min left.</span>
            <span>Subscribe · ₹399/mo · 90 min.</span>
          </Link>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/pricing"
            className="hidden sm:inline-flex text-[#A6AABF] hover:text-white transition-colors"
          >
            Subscribe · ₹399/mo
          </Link>

          {/* Account Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#C4C7D7] hover:text-white hover:bg-[#181A24] transition-all cursor-pointer"
            >
              <span>My account</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#181A24] border border-[#2B2F42] rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#232634] text-[11px]">
                  <p className="font-semibold text-white truncate">{user?.name || "Creator"}</p>
                  <p className="text-[#8A8E9F] truncate">{user?.email || "free_tier"}</p>
                  <p className="text-[#E5C583] font-mono mt-1 font-bold">
                    {user?.credits_balance ?? 10} Credits available
                  </p>
                </div>

                <Link
                  href="/pricing"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[#C4C7D7] hover:text-white hover:bg-[#202330] transition-colors"
                >
                  <span>Upgrade plan</span>
                </Link>

                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#E0353E] hover:bg-[#202330] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <Link
            href="/pricing"
            className="px-3 py-1 rounded-lg bg-[#181A24] hover:bg-[#202330] text-[#E5C583] border border-[#E5C583]/40 font-semibold shadow-sm transition-all"
          >
            Upgrade
          </Link>

          <span className="hidden lg:inline text-[11px] text-[#8A8E9F]">
            3 of 3 free exports left · resets Nov 1
          </span>
        </div>
      </header>

      {/* Main Container: Sidebar + Dashboard Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar (Exact Screenshot 2) */}
        <aside className="w-56 bg-[#101118] border-r border-[#232634] flex flex-col justify-between p-3 shrink-0">
          <div className="space-y-4">
            {/* + New caption button (Gold pill) */}
            <button
              type="button"
              onClick={handleNewCaption}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow-lg shadow-[#F3E8CE]/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New caption</span>
            </button>

            {/* Nav list */}
            <nav className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveSidebarNav("reels")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all text-left ${
                  activeSidebarNav === "reels"
                    ? "bg-[#1C1E2A] text-white font-semibold"
                    : "text-[#8A8E9F] hover:text-white hover:bg-[#161822]"
                }`}
              >
                <Film className="w-3.5 h-3.5 text-[#E5C583]" />
                <span>My reels</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSidebarNav("thumbnails")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all text-left ${
                  activeSidebarNav === "thumbnails"
                    ? "bg-[#1C1E2A] text-white font-semibold"
                    : "text-[#8A8E9F] hover:text-white hover:bg-[#161822]"
                }`}
              >
                <Image className="w-3.5 h-3.5 text-[#8A8E9F]" />
                <span>Thumbnails</span>
              </button>

              <Link
                href="/support"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#8A8E9F] hover:text-white hover:bg-[#161822] transition-all text-left"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#8A8E9F]" />
                <span>Help & support</span>
              </Link>

              <a
                href="mailto:support@manacaptions.com"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#8A8E9F] hover:text-white hover:bg-[#161822] transition-all text-left"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#8A8E9F]" />
                <span>Share feedback</span>
              </a>
            </nav>
          </div>

          {/* Bottom Sidebar: YOUR PLAN Widget (Exact Screenshot 2) */}
          <div className="p-3 bg-[#0A0B10] border border-[#1E202D] rounded-xl space-y-2.5 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7082] font-bold block">
              Your Plan
            </span>

            {/* Transcription */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#8A8E9F]">Transcription</span>
                <span className="text-[#FFFFFF] font-semibold">0.5 min left</span>
              </div>
              <div className="w-full h-1 bg-[#1E202D] rounded-full overflow-hidden">
                <div className="h-full bg-[#E5C583] w-1/4 rounded-full" />
              </div>
            </div>

            {/* Exports */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8A8E9F]">Exports</span>
              <span className="text-[#FFFFFF] font-semibold">3 of 3 left</span>
            </div>

            <p className="text-[10px] text-[#6B7082]">
              Free minutes reset in 2 days
            </p>

            <Link
              href="/pricing"
              className="w-full py-1.5 rounded-lg bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow transition-all cursor-pointer text-center block"
            >
              Upgrade
            </Link>
          </div>
        </aside>

        {/* Main Reels Dashboard Area */}
        <main className="flex-1 bg-[#0D0E12] p-6 overflow-y-auto space-y-4 min-h-0">
          {/* Header Row: Your reels & Filter Tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-[#232634]">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Your reels
            </h1>

            {/* Filter Tabs (In progress | Finished) */}
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#181A24] border border-[#2B2F42] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("inprogress")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  activeTab === "inprogress"
                    ? "bg-[#F3E8CE] text-black shadow-sm"
                    : "text-[#8A8E9F] hover:text-white"
                }`}
              >
                In progress
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("finished")}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  activeTab === "finished"
                    ? "bg-[#F3E8CE] text-black shadow-sm"
                    : "text-[#8A8E9F] hover:text-white"
                }`}
              >
                Finished
              </button>
            </div>
          </div>

          {/* Info Notice Banner */}
          <div className="px-3.5 py-2.5 rounded-xl bg-[#181A24] border border-[#2B2F42] text-xs text-[#E5C583] font-medium flex items-center justify-between">
            <span>Edits stay about 1 hour to tweak and re-export.</span>
          </div>

          {/* Grid of Reels & + New caption card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
            {/* Card 1: + New caption (Exact Screenshot 2) */}
            <div
              onClick={handleNewCaption}
              className="aspect-[9/16] rounded-2xl border-2 border-dashed border-[#2B2F42] hover:border-[#E5C583]/60 bg-[#12131A] hover:bg-[#161822] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group shadow-sm hover:scale-[1.02]"
            >
              <div className="w-12 h-12 rounded-full bg-[#1A1C27] border border-[#2B2F42] flex items-center justify-center mb-3 group-hover:bg-[#E5C583] group-hover:text-black transition-all">
                <Upload className="w-5 h-5 text-[#8A8E9F] group-hover:text-black transition-colors" />
              </div>
              <span className="text-sm font-bold text-white group-hover:text-[#E5C583] transition-colors">
                + New caption
              </span>
              <p className="text-[11px] text-[#8A8E9F] mt-2">
                MP4 or MOV · up to 5 min
              </p>
              <p className="text-[10px] text-[#6B7082] mt-0.5">
                1080p · up to 200 MB
              </p>
            </div>

            {/* Existing user reels */}
            {projects && projects.length > 0 && projects.map(proj => (
              <div
                key={proj.id}
                onClick={handleNewCaption}
                className="aspect-[9/16] rounded-2xl border border-[#232634] bg-[#12131A] hover:border-[#E5C583] overflow-hidden flex flex-col justify-between p-3 cursor-pointer transition-all hover:scale-[1.02] relative group"
              >
                <div className="flex items-center justify-between text-[10px] text-[#8A8E9F]">
                  <span className="font-mono">{proj.durationSec || 30}s</span>
                  <span className="text-[#E5C583] font-bold">1080p</span>
                </div>
                <div className="mt-auto">
                  <p className="text-xs font-bold text-white truncate">{proj.title || "Telugu Reel"}</p>
                  <p className="text-[10px] text-[#8A8E9F] mt-0.5">Ready to edit</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

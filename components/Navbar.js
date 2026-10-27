"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Video, Moon, Sun, Type, Wand2, Film, LayoutDashboard, LogIn, LogOut, ChevronDown, Zap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function Navbar({
  onLoadDemo,
  onResetVideo,
  hasVideo,
  activeTab,
  setActiveTab,
  theme,
  setTheme
}) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="h-16 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-50 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={onResetVideo}
          title="Return to ManaCaption home"
        >
          {/* Logo container ready for custom logo attachment */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#20309A] via-[#384DE8] to-[#BB232B] flex items-center justify-center shadow-[0_0_15px_rgba(32,48,154,0.5)] border border-[#F8F3F0]/20 text-[#F8F3F0] font-black text-xs tracking-tighter group-hover:scale-105 transition-all">
            MC
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#F8F3F0] text-base sm:text-lg tracking-tight group-hover:text-white transition-colors">
              ManaCaption
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 font-bold shadow-[0_0_10px_rgba(187,35,43,0.3)]">
              Studio
            </span>
          </div>
        </div>

        {/* Dashboard Shortcut */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/80 hover:text-[#F8F3F0] border border-[#20309A]/40 text-xs font-semibold transition-all hover:border-[#384DE8]/60 shadow-sm"
          title="Open Creator Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-[#384DE8]" />
          <span>Dashboard</span>
        </Link>

        {/* Pricing Shortcut */}
        <Link
          href="/pricing"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/80 hover:text-[#F8F3F0] border border-[#20309A]/40 text-xs font-semibold transition-all hover:border-[#BB232B]/60 shadow-sm"
          title="Buy Credits & Pricing"
        >
          <Zap className="w-3.5 h-3.5 text-[#BB232B] fill-[#BB232B]" />
          <span>Pricing</span>
        </Link>
      </div>

      {/* Center Navigation Tabs (Direct Studio Tabs) */}
      {hasVideo && (
        <div className="flex items-center bg-[#090D24] p-1 rounded-2xl border border-[#20309A]/40 text-xs shadow-inner">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === "transcript"
                ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-[#F8F3F0] shadow-[0_0_15px_rgba(32,48,154,0.5)] font-bold"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0] hover:bg-[#111840]"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Transcript</span>
          </button>
          <button
            onClick={() => setActiveTab("style")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === "style"
                ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-[#F8F3F0] shadow-[0_0_15px_rgba(32,48,154,0.5)] font-bold"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0] hover:bg-[#111840]"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Styles &amp; Presets</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-gradient-to-r from-[#20309A] to-[#BB232B] text-[#F8F3F0] shadow-[0_0_15px_rgba(32,48,154,0.5)] font-bold"
                : "text-[#F8F3F0]/60 hover:text-[#F8F3F0] hover:bg-[#111840]"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Export &amp; Downloads</span>
          </button>
        </div>
      )}

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onLoadDemo}
          title="Load pre-configured demo reel with Telugu captions"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#20309A]/20 hover:bg-[#20309A]/35 text-[#F8F3F0] border border-[#20309A]/50 text-xs font-semibold transition-all cursor-pointer shadow-[0_0_15px_rgba(32,48,154,0.2)] hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#384DE8]" />
          <span>Demo Reel</span>
        </button>

        {hasVideo && (
          <button
            onClick={onResetVideo}
            title="Upload new video"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/80 hover:text-white border border-[#20309A]/40 text-xs font-medium transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Video</span>
          </button>
        )}

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/70 hover:text-[#F8F3F0] border border-[#20309A]/40 transition-all cursor-pointer"
          title="Toggle color theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-[#384DE8]" /> : <Moon className="w-4 h-4 text-[#384DE8]" />}
        </button>

        {/* User Account / Profile Button */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] border border-[#BB232B]/40 hover:border-[#BB232B] text-[#F8F3F0] text-xs font-bold transition-all shadow-[0_0_15px_rgba(187,35,43,0.25)] hover:scale-105"
              title="Top Up Credits"
            >
              <Zap className="w-3.5 h-3.5 text-[#BB232B] fill-[#BB232B]" />
              <span>{user.credits_balance ?? 10} Credits</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#0D1333] border border-transparent hover:border-[#20309A]/40 transition-colors cursor-pointer"
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                  alt={user.name}
                  className="w-8 h-8 rounded-xl object-cover border border-[#20309A]/60 shadow-[0_0_10px_rgba(32,48,154,0.4)]"
                />
                <ChevronDown className="w-3 h-3 text-[#F8F3F0]/60" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090D26] border border-[#20309A]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(32,48,154,0.3)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                  <div className="p-2.5 border-b border-[#20309A]/30 mb-1">
                    <p className="text-xs font-bold text-[#F8F3F0] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#F8F3F0]/60 truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] font-bold border border-[#BB232B]/40">
                      {user.plan || "Creator Pro"}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#F8F3F0]/80 hover:text-white hover:bg-[#101742] transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#384DE8]" />
                    <span>Creator Dashboard</span>
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#F8F3F0]/80 hover:text-white hover:bg-[#101742] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-[#BB232B] fill-[#BB232B]" />
                    <span>Buy Credits</span>
                  </Link>

                  <Link
                    href="/admin"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#F8F3F0]/80 hover:text-white hover:bg-[#101742] transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#384DE8]" />
                    <span>Admin Hub</span>
                  </Link>

                  <button
                    onClick={() => { logout(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#E0353E] hover:bg-[#BB232B]/15 transition-colors cursor-pointer text-left mt-1 border-t border-[#20309A]/30 pt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#20309A] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-[#F8F3F0] text-xs font-bold transition-all shadow-[0_0_15px_rgba(32,48,154,0.4)] hover:scale-105"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}

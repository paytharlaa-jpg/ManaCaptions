"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Video, Moon, Sun, Type, Wand2, Film, LayoutDashboard, LogIn, LogOut, ChevronDown, Zap } from "lucide-react";
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
    <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-50">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={onResetVideo}
          title="Return to home / upload"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-xs tracking-tighter group-hover:scale-105 transition-transform">
            MC
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-sm sm:text-base tracking-tight">ManaCaptions</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold">
              Studio
            </span>
          </div>
        </div>

        {/* Dashboard Shortcut */}
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold transition-colors"
          title="Open Creator Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-orange-400" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Center Navigation Tabs (Direct Studio Tabs) */}
      {hasVideo && (
        <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "transcript"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Transcript</span>
          </button>
          <button
            onClick={() => setActiveTab("style")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "style"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Styles &amp; Presets</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Export &amp; Downloads</span>
          </button>
        </div>
      )}

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLoadDemo}
          title="Load pre-configured demo reel with Telugu captions"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Reel</span>
        </button>

        {hasVideo && (
          <button
            onClick={onResetVideo}
            title="Upload new video"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-medium transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Video</span>
          </button>
        )}

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all cursor-pointer"
          title="Toggle color theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account / Profile Button */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-colors shadow-sm"
              title="Your Credit Balance"
            >
              <Zap className="w-3.5 h-3.5 fill-orange-400" />
              <span>{user.credits_balance ?? 100}</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors cursor-pointer"
              >
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover border border-orange-500/40"
              />
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-neutral-800 mb-1">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30">
                    {user.plan || "Creator Pro"}
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-orange-400" />
                  <span>Creator Dashboard</span>
                </Link>

                <button
                  onClick={() => { logout(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left mt-1 border-t border-neutral-800 pt-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm shadow-orange-500/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronDown,
  Download,
  Plus,
  Check,
  Zap,
  LogOut,
  User,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function Navbar({
  onLoadDemo = () => {},
  onResetVideo = () => {},
  hasVideo = false,
  onDownloadSrt = () => {},
  onExportClick = () => {},
  isExporting = false
}) {
  const { user, logout } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <header className="h-14 border-b border-[#232634] bg-[#0E0F15] px-3 sm:px-5 flex items-center justify-between shrink-0 select-none z-50">
      {/* Left: Brand & Status Ticker */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-[#181A24] border border-[#2B2F42] flex items-center justify-center p-0.5 group-hover:scale-105 transition-all">
            <img src="/logo-icon.png" alt="ManaCaptions Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-[#FFFFFF] text-base tracking-tight">
            Mana<span className="text-[#E5C583]">Captions</span>
          </span>
        </Link>

        {/* Ticker / Subscription Pill (Replix Style) */}
        <Link
          href="/pricing"
          className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181A24] hover:bg-[#202330] border border-[#2B2F42] text-[11px] text-[#A6AABF] hover:text-[#FFFFFF] transition-all"
        >
          <span className="text-[#E5C583] font-semibold">0.25 min left.</span>
          <span>Subscribe · ₹399/mo · 90 min.</span>
        </Link>
      </div>

      {/* Right: Actions (My account, Upgrade, Saved, New Video, Download .SRT, Free Exports, Export) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* My Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#C4C7D7] hover:text-white rounded-lg hover:bg-[#181A24] transition-all cursor-pointer"
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
                href="/dashboard"
                onClick={() => setShowAccountMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-[#C4C7D7] hover:text-white hover:bg-[#202330] transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#E5C583]" />
                <span>My reels</span>
              </Link>

              <Link
                href="/pricing"
                onClick={() => setShowAccountMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-[#C4C7D7] hover:text-white hover:bg-[#202330] transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-[#E5C583]" />
                <span>Upgrade plan</span>
              </Link>

              {user ? (
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
              ) : null}
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        <Link
          href="/pricing"
          className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg bg-[#181A24] hover:bg-[#202330] text-[#E5C583] border border-[#E5C583]/40 transition-all shadow-sm"
        >
          Upgrade
        </Link>

        {/* Saved Status Indicator */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#8A8E9F] font-medium">
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>Saved</span>
        </div>

        {/* New Video Button */}
        <button
          type="button"
          onClick={onResetVideo}
          className="hidden md:inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#C4C7D7] hover:text-white bg-[#181A24] hover:bg-[#202330] border border-[#2B2F42] rounded-lg transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>New Video</span>
        </button>

        {/* Download .SRT */}
        {hasVideo && (
          <button
            type="button"
            onClick={onDownloadSrt}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#C4C7D7] hover:text-white bg-[#181A24] hover:bg-[#202330] border border-[#2B2F42] rounded-lg transition-all cursor-pointer"
            title="Download free SubRip (.SRT) timed caption file"
          >
            <Download className="w-3 h-3" />
            <span>Download .SRT</span>
          </button>
        )}

        {/* Subtle Free Exports Left Indicator */}
        <span className="hidden xl:inline text-[11px] text-[#8A8E9F]">
          3 of 3 free exports left · resets Nov 1
        </span>

        {/* Export Button (Signature Glowing Gold Filled Pill) */}
        <button
          type="button"
          onClick={onExportClick}
          disabled={!hasVideo || isExporting}
          className="px-4 py-1.5 rounded-lg bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow-lg shadow-[#F3E8CE]/20 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
        >
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}

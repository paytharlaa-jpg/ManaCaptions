"use client";

import React from "react";
import Link from "next/link";
import { Zap, AlertCircle, CheckCircle2, X, ArrowRight, ShieldCheck } from "lucide-react";

export default function CreditCostModal({
  isOpen,
  onClose,
  onConfirm,
  cost = 1,
  currentBalance = 10,
  actionTitle = "Generate ManaCaption",
  description = "Audio speech recognition & word-level karaoke boundary synchronization.",
  durationSec = null,
  isProcessing = false
}) {
  if (!isOpen) return null;

  const hasEnoughCredits = currentBalance >= cost;
  const balanceAfter = Math.max(0, currentBalance - cost);

  const formatDuration = (sec) => {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0C1230] border border-[#20309A]/40 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(32,48,154,0.2)] relative space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#20309A]/30 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#20309A]/20 border border-[#20309A]/40 flex items-center justify-center text-[#384DE8]">
              <Zap className="w-5 h-5 fill-[#384DE8]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F8F3F0]">{actionTitle}</h3>
              <p className="text-[11px] text-[#F8F3F0]/60">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-7 h-7 rounded-lg hover:bg-[#141C48] text-[#F8F3F0]/60 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breakdown Card */}
        <div className="bg-[#060919] border border-[#20309A]/30 rounded-2xl p-4 space-y-3">
          {durationSec ? (
            <div className="flex items-center justify-between text-xs text-[#F8F3F0]/60 pb-2 border-b border-[#20309A]/20">
              <span>Video Duration</span>
              <span className="font-mono text-[#F8F3F0] font-semibold">
                {formatDuration(durationSec)} ({cost} {cost === 1 ? "credit" : "credits"} • 1 credit/min)
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-xs text-[#F8F3F0]/80">
            <span>Action Cost</span>
            <span className="font-mono font-bold text-[#BB232B] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-[#BB232B]" />
              {cost} {cost === 1 ? "credit" : "credits"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#F8F3F0]/60">
            <span>Your Current Balance</span>
            <span className="font-mono font-semibold text-[#F8F3F0]">
              {currentBalance} credits
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#20309A]/20 font-semibold">
            <span className={hasEnoughCredits ? "text-[#F8F3F0]/80" : "text-[#E0353E]"}>
              Balance After Action
            </span>
            <span className={`font-mono font-bold ${hasEnoughCredits ? "text-emerald-400" : "text-[#E0353E]"}`}>
              {hasEnoughCredits ? `${balanceAfter} credits` : "Insufficient Credits"}
            </span>
          </div>
        </div>

        {/* Status Callout */}
        {hasEnoughCredits ? (
          <div className="p-3 rounded-xl bg-[#20309A]/20 border border-[#20309A]/40 text-[#F8F3F0] text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#384DE8]" />
            <span>This will use <strong>{cost} {cost === 1 ? "credit" : "credits"}</strong>. You have <strong>{currentBalance}</strong> available.</span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E0353E] mt-0.5" />
            <div>
              <p className="font-bold text-[#E0353E]">Not enough credits!</p>
              <p className="text-[11px] text-[#F8F3F0]/70 mt-0.5">
                You need {cost} credits for this action, but have {currentBalance} credits remaining.
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#F8F3F0]/60 hover:text-white hover:bg-[#101742] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {hasEnoughCredits ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(32,48,154,0.4)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{isProcessing ? "Processing..." : `Confirm & Use ${cost} ${cost === 1 ? "Credit" : "Credits"}`}</span>
            </button>
          ) : (
            <Link
              href="/pricing"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(187,35,43,0.4)] flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>Buy Credits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}

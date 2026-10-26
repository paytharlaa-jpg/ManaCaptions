"use client";

import React from "react";
import Link from "next/link";
import { Zap, AlertCircle, CheckCircle2, X, ArrowRight, ShieldCheck } from "lucide-react";

export default function CreditCostModal({
  isOpen,
  onClose,
  onConfirm,
  cost = 1,
  currentBalance = 100,
  actionTitle = "Generate ManaCaptions",
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Zap className="w-5 h-5 fill-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{actionTitle}</h3>
              <p className="text-[11px] text-neutral-400">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-7 h-7 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Breakdown Card */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4 space-y-3">
          {durationSec ? (
            <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800/60">
              <span>Video Duration</span>
              <span className="font-mono text-neutral-200 font-semibold">
                {formatDuration(durationSec)} ({Math.ceil(durationSec / 60)} min billed)
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span>Action Cost</span>
            <span className="font-mono font-bold text-orange-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-orange-400" />
              {cost} {cost === 1 ? "credit" : "credits"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Your Current Balance</span>
            <span className="font-mono font-semibold text-neutral-200">
              {currentBalance} credits
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800/60 font-semibold">
            <span className={hasEnoughCredits ? "text-neutral-300" : "text-rose-400"}>
              Balance After Action
            </span>
            <span className={`font-mono font-bold ${hasEnoughCredits ? "text-emerald-400" : "text-rose-400"}`}>
              {hasEnoughCredits ? `${balanceAfter} credits` : "Insufficient Credits"}
            </span>
          </div>
        </div>

        {/* Status Callout */}
        {hasEnoughCredits ? (
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-orange-400" />
            <span>This will use <strong>{cost} {cost === 1 ? "credit" : "credits"}</strong>. You have <strong>{currentBalance}</strong> available.</span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold">Not enough credits!</p>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
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
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {hasEnoughCredits ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{isProcessing ? "Processing..." : `Confirm & Use ${cost} ${cost === 1 ? "Credit" : "Credits"}`}</span>
            </button>
          ) : (
            <Link
              href="/pricing"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all hover:scale-105"
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

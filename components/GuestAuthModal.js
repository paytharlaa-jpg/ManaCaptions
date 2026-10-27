"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  X,
  CheckCircle2,
  Download,
  Languages,
  Film,
  Loader2,
  Mail
} from "lucide-react";

export default function GuestAuthModal({
  isOpen,
  onClose,
  actionType = "download_video",
  onSuccess
}) {
  const {
    loginWithGoogle,
    loginWithGoogleAccount,
    loginDemoAccount,
    loginWithEmail,
    sendOtp,
    verifyOtp,
    googleConfigured,
    claimGuestProjects
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState(null);
  const [showEmailInput, setShowEmailInput] = useState(false);

  if (!isOpen) return null;

  const actionTitle =
    actionType === "translate"
      ? "Sign in to translate your captions and get 10 free credits"
      : "Sign in to download your captions and get 10 free credits";

  const actionDesc =
    actionType === "translate"
      ? "Unlock fast dual-script Telugu AI translation and auto-save this project to your account."
      : "Unlock high-definition MP4 downloads, SRT subtitles, and claim this project to your account.";

  const handlePostLogin = async (user) => {
    try {
      if (claimGuestProjects) {
        await claimGuestProjects();
      }
      if (onSuccess) {
        onSuccess(user);
      }
      onClose();
    } catch (e) {
      console.warn("Post login sync notice:", e);
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (googleConfigured) {
        sessionStorage.setItem("tc_pending_guest_action", actionType);
        window.location.href = "/api/auth/google/login";
        return;
      }
      const demoAccount = {
        id: "google_guest_claimed",
        name: "Google Creator",
        email: "hello.trygaruda@gmail.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
      };
      const user = await loginWithGoogleAccount(demoAccount);
      await handlePostLogin(user);
    } catch (err) {
      setError(err.message || "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginDemoAccount();
      await handlePostLogin(user);
    } catch (err) {
      setError(err.message || "Quick sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await sendOtp(cleanEmail);
      setOtpSent(true);
      if (data?.devMode && data?.devOtp) {
        setDevOtp(data.devOtp);
      }
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await verifyOtp(email.trim(), cleanOtp);
      await handlePostLogin(user);
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0C1230] border border-[#20309A]/40 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(32,48,154,0.2)] overflow-hidden text-[#F8F3F0]">
        {/* Subtle accent glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#20309A]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#BB232B]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#F8F3F0]/60 hover:text-white hover:bg-[#141C48] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BB232B]/20 border border-[#BB232B]/40 text-[#F8F3F0] text-xs font-bold mb-3 shadow-[0_0_10px_rgba(187,35,43,0.25)]">
          <Zap className="w-3.5 h-3.5 fill-[#BB232B] text-[#BB232B]" />
          <span>10 Free Credits Included at Signup</span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {actionTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#F8F3F0]/70 mt-2 leading-relaxed">
          {actionDesc}
        </p>

        {/* Perks list */}
        <div className="my-5 p-3.5 rounded-2xl bg-[#060919] border border-[#20309A]/30 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#F8F3F0]/85">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Automatic transfer of your current captions and video</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#F8F3F0]/85">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>10 bonus credits added immediately (never expires)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#F8F3F0]/85">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Universal MP4 video export &amp; SRT subtitles download</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Main Option: Continue with Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Quick 1-Click Creator Sign In Option */}
          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-3 px-3 rounded-xl bg-[#20309A]/20 hover:bg-[#20309A]/35 border border-[#20309A]/50 text-[#F8F3F0] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Instant 1-Click Creator Sign In</span>
          </button>

          {/* Email OTP Option Toggle */}
          {!showEmailInput ? (
            <button
              onClick={() => setShowEmailInput(true)}
              className="w-full text-center text-xs text-[#F8F3F0]/60 hover:text-white pt-1 transition-colors cursor-pointer"
            >
              Sign in with email verification instead
            </button>
          ) : !otpSent ? (
            <form onSubmit={handleSendEmailOtp} className="pt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="flex-1 bg-[#060919] border border-[#20309A]/40 rounded-xl px-3 py-2 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/40 focus:outline-none focus:border-[#384DE8]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Code"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmailOtp} className="pt-2 space-y-2">
              {devOtp && (
                <div className="p-2 rounded-lg bg-[#20309A]/20 border border-[#20309A]/40 text-[#F8F3F0] text-[11px] flex justify-between items-center">
                  <span>Dev Code: <strong className="font-mono text-white ml-1">{devOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="underline text-[#BB232B] cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                  className="flex-1 bg-[#060919] border border-[#20309A]/40 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8]"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify & Claim"}
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-[#F8F3F0]/60 px-1 pt-1">
                <span>Sent to {email}</span>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); }}
                  className="text-[#384DE8] hover:underline cursor-pointer"
                >
                  Change email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import {
  X,
  Loader2,
  Check,
  ShieldCheck
} from "lucide-react";

export default function GuestAuthModal({
  isOpen,
  onClose,
  actionType = "download_video",
  onSuccess
}) {
  const {
    loginWithGoogleAccount,
    loginDemoAccount,
    googleConfigured,
    claimGuestProjects
  } = useAuth();

  const [activeTab, setActiveTab] = useState("signin"); // 'signin' | 'create'
  const [showGoogleConfirm, setShowGoogleConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreeUpdates, setAgreeUpdates] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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

  const handleGoogleClick = () => {
    setShowGoogleConfirm(true);
  };

  const executeGoogleLogin = async () => {
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
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
        email: email || "creator@gmail.com",
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

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const demoUser = {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
        name: email.split("@")[0] || "Creator",
        email: email.trim(),
        avatar: null
      };
      const user = await loginWithGoogleAccount(demoUser);
      await handlePostLogin(user);
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      {/* Modal Card */}
      <div className="w-full max-w-sm bg-[#161822] border border-[#2B2F42] rounded-2xl shadow-2xl overflow-hidden relative text-[#FFFFFF]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 rounded-lg text-[#8A8E9F] hover:text-white hover:bg-[#252838] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VIEW 1: Google Confirm with Terms Checkboxes (Screenshot 3) */}
        {showGoogleConfirm ? (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#FFFFFF]">
                Continue with Google
              </h3>
              <p className="text-xs text-[#8A8E9F] mt-1">
                Google sign in creates your free ManaCaptions account.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#E0353E]/15 border border-[#E0353E]/30 text-xs text-[#FF858A]">
                {error}
              </div>
            )}

            {/* Checkbox 1: Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#C4C7D7] leading-relaxed">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#383C52] bg-[#0E0F15] text-[#E5C583] focus:ring-0 cursor-pointer accent-[#E5C583]"
              />
              <span>
                I'm 18 or older and I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-[#E5C583] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-[#E5C583] hover:underline">
                  Privacy Policy
                </Link>
                , and I understand the limits of the free plan.
              </span>
            </label>

            {/* Checkbox 2: Updates */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#C4C7D7] leading-relaxed">
              <input
                type="checkbox"
                checked={agreeUpdates}
                onChange={e => setAgreeUpdates(e.target.checked)}
                className="mt-0.5 rounded border-[#383C52] bg-[#0E0F15] text-[#E5C583] focus:ring-0 cursor-pointer accent-[#E5C583]"
              />
              <span>Email me product updates and offers.</span>
            </label>

            {/* Submit Google */}
            <button
              type="button"
              onClick={executeGoogleLogin}
              disabled={loading || !agreeTerms}
              className="w-full py-2.5 rounded-xl bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Continue with Google</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowGoogleConfirm(false)}
              className="w-full py-1 text-xs text-[#8A8E9F] hover:text-white transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* VIEW 2: Sign In / Create Account with Google & Email (Screenshot 4) */
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#FFFFFF]">
                Sign in to ManaCaptions
              </h3>
              <p className="text-xs text-[#8A8E9F] mt-1">
                Sign in or create your free account.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#E0353E]/15 border border-[#E0353E]/30 text-xs text-[#FF858A]">
                {error}
              </div>
            )}

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-black font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5 border border-gray-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#2B2F42]" />
              <span className="text-[11px] text-[#6B7082] uppercase">or</span>
              <div className="flex-1 h-px bg-[#2B2F42]" />
            </div>

            {/* Segmented Toggle: Sign in | Create account */}
            <div className="grid grid-cols-2 p-0.5 rounded-lg bg-[#0E0F15] border border-[#2B2F42] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className={`py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === "signin"
                    ? "bg-[#F3E8CE] text-black shadow-sm"
                    : "text-[#8A8E9F] hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`py-1.5 rounded-md font-semibold transition-all ${
                  activeTab === "create"
                    ? "bg-[#F3E8CE] text-black shadow-sm"
                    : "text-[#8A8E9F] hover:text-white"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0E0F15] border border-[#2B2F42] rounded-xl text-xs text-white placeholder-[#5A5E72] focus:border-[#E5C583] focus:outline-none"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0E0F15] border border-[#2B2F42] rounded-xl text-xs text-white placeholder-[#5A5E72] focus:border-[#E5C583] focus:outline-none"
              />

              <div className="flex items-center justify-end">
                <span className="text-[11px] text-[#E5C583] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>

              {/* Cloudflare Turnstile Simulated Badge */}
              <div className="p-2 rounded-lg bg-[#0E0F15] border border-[#2B2F42] flex items-center justify-between text-xs text-[#8A8E9F]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-white text-[11px] font-medium">Success</span>
                </div>
                <span className="text-[10px] text-[#6B7082] font-semibold">CLOUDFLARE</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{activeTab === "signin" ? "Sign In" : "Create account"}</span>}
              </button>
            </form>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-0.5 text-xs text-[#8A8E9F] hover:text-white transition-colors text-center"
            >
              Cancel
            </button>

            {/* Footer Notice */}
            <p className="text-[10px] text-[#6B7082] text-center leading-relaxed">
              By continuing, you agree to the{" "}
              <Link href="/terms" target="_blank" className="text-[#E5C583] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="text-[#E5C583] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

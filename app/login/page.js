"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Mail,
  User,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  KeyRound,
  RotateCw,
  X
} from "lucide-react";

// Google Account Avatars for fallback chooser experience
const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    id: "google_user_abhiram",
    name: "Abhiram Gantyada",
    email: "gantyada.abhiram@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    initial: "A",
    bgColor: "bg-orange-500"
  },
  {
    id: "google_user_creator",
    name: "Telugu Reels Creator",
    email: "telugu.creator.studio@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    initial: "T",
    bgColor: "bg-emerald-600"
  }
];

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    googleConfigured,
    loginWithGoogle,
    loginWithGoogleAccount,
    sendOtp,
    verifyOtp
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [devOtp, setDevOtp] = useState(null);
  const [resendNotice, setResendNotice] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google Sign-In Dialog State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [selectedAccountLoading, setSelectedAccountLoading] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customAvatarPreview, setCustomAvatarPreview] = useState("");

  // If already logged in, redirect to Dashboard
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Click "Continue with Google"
  const handleGoogleClick = () => {
    setError(null);
    if (googleConfigured) {
      // If server-side Google OAuth credentials are in .env.local, redirect to official Google OAuth
      window.location.href = "/api/auth/google/login";
    } else {
      // Otherwise open Google Sign-In helper modal
      setShowGoogleModal(true);
    }
  };

  // User chooses an existing Google Account from helper modal
  const handleSelectAccount = (account) => {
    setSelectedAccountLoading(account.id);
    setTimeout(() => {
      loginWithGoogleAccount(account);
      setShowGoogleModal(false);
      router.push("/");
    }, 700);
  };

  // User enters their custom Google Account details
  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;

    setSelectedAccountLoading("custom");
    const accountName = customName.trim() || customEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName = accountName.charAt(0).toUpperCase() + accountName.slice(1);
    
    const realAvatarUrl = customAvatarPreview || `https://unavatar.io/${encodeURIComponent(customEmail.trim())}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=f97316`;

    const newAccount = {
      id: `google_${Date.now()}`,
      name: formattedName,
      email: customEmail.trim(),
      avatar: realAvatarUrl,
      initial: formattedName.charAt(0).toUpperCase(),
      bgColor: "bg-orange-500"
    };

    setTimeout(() => {
      loginWithGoogleAccount(newAccount);
      setShowGoogleModal(false);
      router.push("/");
    }, 700);
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const data = await sendOtp(cleanEmail);
      setStep("otp");
      setResendCooldown(45);
      setSuccessMsg(`Verification code sent to ${cleanEmail}`);
      if (data?.devMode && data?.devOtp) {
        setDevOtp(data.devOtp);
        setResendNotice(data?.resendNotice || null);
      } else {
        setDevOtp(null);
        setResendNotice(null);
      }
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      await verifyOtp(email.trim(), cleanOtp, name.trim());
      router.push("/");
    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060919] text-[#F8F3F0] flex flex-col justify-between selection:bg-[#20309A] selection:text-[#F8F3F0] relative overflow-hidden">
      {/* Background royal ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#20309A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#BB232B]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between z-10 w-full max-w-6xl mx-auto border-b border-[#20309A]/30">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#20309A] via-[#384DE8] to-[#BB232B] flex items-center justify-center shadow-[0_0_15px_rgba(32,48,154,0.5)] border border-[#F8F3F0]/20 text-[#F8F3F0] font-black text-xs group-hover:scale-105 transition-transform">
            MC
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#F8F3F0] text-base tracking-tight">ManaCaption</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 font-bold shadow-[0_0_10px_rgba(187,35,43,0.3)]">
              Studio
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 text-xs text-[#F8F3F0]/80 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-[#0D1333] border border-[#20309A]/40"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#384DE8]" />
          </Link>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-[#0C1230]/85 border border-[#20309A]/40 rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(32,48,154,0.2)] backdrop-blur-xl space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#20309A] via-[#384DE8] to-[#BB232B] flex items-center justify-center shadow-[0_0_20px_rgba(32,48,154,0.5)] text-white font-black text-sm mx-auto mb-3 border border-[#F8F3F0]/20">
              MC
            </div>
            <h1 className="text-2xl font-black text-[#F8F3F0] tracking-tight">
              {step === "otp"
                ? "Enter Verification Code"
                : isSignUp
                ? "Create Creator Account"
                : "Sign in to ManaCaption"}
            </h1>
            <p className="text-xs text-[#F8F3F0]/65">
              {step === "otp"
                ? `We sent a 6-digit code to ${email}`
                : isSignUp
                ? "Get 10 free credits to create viral Telugu subtitles."
                : "Choose Google or verified email OTP to continue."}
            </p>
          </div>

          {/* STEP 1: Email Input or Google Sign-In */}
          {step === "email" ? (
            <div className="space-y-4">
              {/* Primary Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl cursor-pointer disabled:opacity-50 border border-neutral-200"
              >
                {/* Official Google colored G logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-x-0 h-px bg-[#20309A]/30" />
                <span className="relative bg-[#0C1230] px-3 text-[11px] font-mono uppercase tracking-wider text-[#F8F3F0]/60">
                  or with email OTP
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1">
                      Full Name <span className="text-[#F8F3F0]/40">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#F8F3F0]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Abhiram Gantyada"
                        className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/40 focus:outline-none focus:border-[#384DE8] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#F8F3F0]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/40 focus:outline-none focus:border-[#384DE8] transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(32,48,154,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Send 6-Digit Verification Code</span>
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Sign Up / Sign In */}
              <div className="text-center text-xs text-[#F8F3F0]/60 pt-1">
                {isSignUp ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setError(null);
                      }}
                      className="text-[#384DE8] hover:underline font-bold cursor-pointer"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don&apos;t have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setError(null);
                      }}
                      className="text-[#BB232B] hover:underline font-bold cursor-pointer"
                    >
                      Sign up free (10 credits)
                    </button>
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: 6-Digit OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-[#F8F3F0]/60 pb-1">
                <span>Code sent to <strong>{email}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#384DE8] hover:underline cursor-pointer"
                >
                  Change email
                </button>
              </div>

              {/* Dev Mode / Resend Sandbox Auto-Fill Badge */}
              {devOtp && (
                <div className="p-3 rounded-2xl bg-[#20309A]/20 border border-[#20309A]/40 text-[#F8F3F0] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#384DE8]">Test Code:</span>{" "}
                      <span className="font-mono font-bold tracking-widest text-white px-2 py-0.5 rounded bg-[#060919] border border-[#20309A]/50 ml-1">
                        {devOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtp)}
                      className="text-[11px] font-bold text-[#BB232B] hover:text-white underline cursor-pointer"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                  {resendNotice && (
                    <p className="text-[11px] text-[#F8F3F0]/70 leading-relaxed border-t border-[#20309A]/20 pt-1.5">
                      💡 <strong>Resend Sandbox Rule:</strong> During free trial mode, Resend only delivers live emails to your registered account (<strong>hello.trygaruda@gmail.com</strong>). For any other email address, use the test code above until you add your custom domain at <span className="underline">resend.com/domains</span>.
                    </p>
                  )}
                </div>
              )}

              {/* 6-Digit OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                  6-Digit Security Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#F8F3F0]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl pl-10 pr-4 py-3 text-lg font-mono tracking-[0.4em] text-center text-[#F8F3F0] placeholder-[#F8F3F0]/20 focus:outline-none focus:border-[#384DE8] transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs">
                  {error}
                </div>
              )}

              {successMsg && !error && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(32,48,154,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Sign In (Get 10 Credits)</span>
                  </>
                )}
              </button>

              {/* Resend Code Options */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-neutral-500">Resend code in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="flex items-center gap-1 text-orange-400 hover:underline font-bold cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Zero-Config Google Sign-In Helper Modal (Active until GOOGLE_CLIENT_ID is added) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white text-neutral-900 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 relative border border-neutral-200">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowGoogleModal(false);
                setShowCustomForm(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="text-center space-y-1.5 pb-2">
              <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
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
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Google Sign-In</h2>
              <p className="text-xs text-neutral-500">Choose a test profile or enter your real Gmail</p>
            </div>

            {/* Account List */}
            {!showCustomForm ? (
              <div className="divide-y divide-neutral-100 border-y border-neutral-100">
                {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc)}
                    disabled={selectedAccountLoading !== null}
                    className="w-full py-3 px-2 flex items-center justify-between hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-normal">{acc.email}</div>
                      </div>
                    </div>
                    {selectedAccountLoading === acc.id ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-blue-600 transition-colors" />
                    )}
                  </button>
                ))}

                {/* Option: Enter your own Google account */}
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full py-3 px-2 flex items-center gap-3 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer text-left group"
                >
                  <div className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 group-hover:border-blue-600 group-hover:text-blue-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      Enter your own Google email
                    </div>
                    <div className="text-[11px] text-neutral-500 font-normal">
                      Quickly test with your exact Gmail address
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Account Form */
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Abhiram Gantyada"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="creator@gmail.com"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedAccountLoading === "custom"}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {selectedAccountLoading === "custom" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Helpful Notice about production OAuth */}
            <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 leading-relaxed text-center">
              💡 To enable official Google OAuth popup, add <code className="text-neutral-700 font-mono bg-neutral-100 px-1 rounded">GOOGLE_CLIENT_ID</code> and <code className="text-neutral-700 font-mono bg-neutral-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> to your <code className="text-neutral-700 font-mono bg-neutral-100 px-1 rounded">.env.local</code>.
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="h-14 px-4 sm:px-8 flex items-center justify-between text-[11px] text-neutral-500 max-w-6xl mx-auto w-full z-10">
        <div>&copy; 2026 ManaCaptions Studio. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}

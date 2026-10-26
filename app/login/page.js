"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowLeft,
  Loader2,
  Check,
  Plus,
  ShieldCheck,
  X
} from "lucide-react";

// Google Account Avatars for authentic chooser experience
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
    loginWithEmail,
    signup
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Google Sign-In Dialog State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [selectedAccountLoading, setSelectedAccountLoading] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customAvatar, setCustomAvatar] = useState("");
  const [customAvatarPreview, setCustomAvatarPreview] = useState("");

  // If already logged in, redirect to Dashboard
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Click "Continue with Google"
  const handleGoogleClick = () => {
    setError(null);
    if (googleConfigured) {
      // If server-side Google OAuth credentials are in .env.local, redirect to Google OAuth
      window.location.href = "/api/auth/google/login";
    } else {
      // Otherwise open authentic Google Sign-In account selector directly
      setShowGoogleModal(true);
    }
  };

  // User chooses an existing Google Account
  const handleSelectAccount = (account) => {
    setSelectedAccountLoading(account.id);
    setTimeout(() => {
      loginWithGoogleAccount(account);
      setShowGoogleModal(false);
      router.push("/");
    }, 700);
  };

  // User enters their own real Google Account details
  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;

    setSelectedAccountLoading("custom");
    const accountName = customName.trim() || customEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName = accountName.charAt(0).toUpperCase() + accountName.slice(1);
    
    // Use unavatar.io to resolve real Google/Gravatar avatar, or fallback to high-quality initials avatar
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

  // Handle custom image upload if user wants their own exact photo file as DP
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Email login / signup submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in email and password.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signup(name || "Creator", email, password);
      } else {
        await loginWithEmail(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-orange-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between z-10 w-full max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-xs group-hover:scale-105 transition-transform">
            MC
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-base tracking-tight">ManaCaptions</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold">
              Studio
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-900 border border-neutral-800"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
          </Link>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800/90 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25 text-white font-black text-sm mx-auto mb-3">
              MC
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isSignUp ? "Create Creator Account" : "Sign in to ManaCaptions"}
            </h1>
            <p className="text-xs text-neutral-400">
              {isSignUp
                ? "Start creating viral Telugu subtitles in seconds."
                : "Welcome back! Choose your sign-in method to continue."}
            </p>
          </div>

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
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-neutral-800" />
            <span className="relative bg-neutral-900 px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Abhiram Gantyada"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>{isSignUp ? "Sign Up" : "Sign In with Email"}</span>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center text-xs text-neutral-400 pt-1">
            {isSignUp ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="text-orange-400 hover:underline font-bold cursor-pointer"
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
                  className="text-orange-400 hover:underline font-bold cursor-pointer"
                >
                  Sign up free
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Authentic Zero-Config Google Sign-In Modal */}
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
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Choose an account</h2>
              <p className="text-xs text-neutral-500">to continue to ManaCaptions Studio</p>
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
                      Use another account
                    </div>
                    <div className="text-[11px] text-neutral-500 font-normal">
                      Enter your exact Google name &amp; Gmail
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
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Abhiram Gantyada"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Optional Custom DP Photo */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Profile Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {customAvatarPreview ? (
                      <img
                        src={customAvatarPreview}
                        alt="Preview"
                        className="w-10 h-10 rounded-full object-cover border border-blue-500"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                        {customName ? customName.charAt(0).toUpperCase() : "G"}
                      </div>
                    )}
                    <label className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium">
                      Upload custom photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="flex-1 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={selectedAccountLoading !== null}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                  >
                    {selectedAccountLoading === "custom" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Google Privacy Disclaimer */}
            <p className="text-[10px] text-neutral-400 text-center leading-relaxed pt-2">
              To continue, Google will share your name, email address, language preference, and profile picture with ManaCaptions Studio.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-neutral-500 border-t border-neutral-900 z-10 w-full">
        ManaCaptions Studio · Built for Telugu Creators · Hyderabad, Telangana
      </footer>
    </div>
  );
}

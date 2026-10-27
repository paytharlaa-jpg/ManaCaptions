"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { CREDIT_PACKAGES } from "@/config/pricing";
import {
  Zap,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Video,
  LayoutDashboard
} from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const { user, updateCreditsBalance } = useAuth();

  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]); // Creator Pack by default
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [successState, setSuccessState] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Interactive Calculator Slider (Reels per month)
  const [reelsCount, setReelsCount] = useState(20);

  // FAQ open toggles
  const [openFaq, setOpenFaq] = useState(0);

  // Calculate recommendation based on slider
  const estimatedCreditsNeeded = reelsCount;
  const recommendedPack = estimatedCreditsNeeded <= 30
    ? CREDIT_PACKAGES[0]
    : estimatedCreditsNeeded <= 100
    ? CREDIT_PACKAGES[1]
    : CREDIT_PACKAGES[2];

  const hoursSaved = (reelsCount * 0.75).toFixed(0);

  const handleSelectPackage = async (pkg) => {
    setErrorMessage("");
    setSelectedPackage(pkg);

    if (!user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to start checkout. Please try again.");
      }

      // If live Razorpay checkout
      if (!data.isSandbox && data.keyId && typeof window !== "undefined") {
        await initiateRazorpayCheckout(data, pkg);
      } else {
        // Test Sandbox Simulation Mode
        setCheckoutModal({
          orderId: data.orderId,
          package: pkg,
          isSandbox: true,
          amount: data.amount
        });
      }
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong initializing payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateRazorpayCheckout = async (orderData, pkg) => {
    return new Promise((resolve) => {
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => openRazorpayModal(orderData, pkg, resolve);
        script.onerror = () => {
          setErrorMessage("Failed to load Razorpay checkout script. Please check your network.");
          resolve();
        };
        document.body.appendChild(script);
      } else {
        openRazorpayModal(orderData, pkg, resolve);
      }
    });
  };

  const openRazorpayModal = (orderData, pkg, onComplete) => {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "ManaCaption",
      description: `${pkg.credits} Studio Credits (${pkg.name})`,
      order_id: orderData.orderId,
      theme: { color: "#20309A" },
      prefill: {
        name: user?.name || "",
        email: user?.email || ""
      },
      handler: async function (response) {
        try {
          setIsProcessing(true);
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              packageId: pkg.id,
              isSandbox: false
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.ok && verifyData.success) {
            updateCreditsBalance(verifyData.newBalance);
            setSuccessState({
              creditsAdded: pkg.credits,
              newBalance: verifyData.newBalance,
              package: pkg
            });
          } else {
            setErrorMessage(verifyData.error || "Payment verification failed.");
          }
        } catch (e) {
          setErrorMessage("Failed to verify payment with server.");
        } finally {
          setIsProcessing(false);
          onComplete();
        }
      },
      modal: {
        ondismiss: function () {
          onComplete();
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleConfirmSandboxPayment = async () => {
    if (!checkoutModal) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkoutModal.orderId,
          packageId: checkoutModal.package.id,
          isSandbox: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Payment simulation failed.");
      }

      updateCreditsBalance(data.newBalance);
      setSuccessState({
        creditsAdded: checkoutModal.package.credits,
        newBalance: data.newBalance,
        package: checkoutModal.package
      });
      setCheckoutModal(null);
    } catch (err) {
      setErrorMessage(err.message || "Failed to complete payment simulation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const faqs = [
    {
      q: "Do purchased credits ever expire?",
      a: "Never! Your credits remain safely in your account forever until you use them. There are no monthly resets or forced usage limits."
    },
    {
      q: "How are credits calculated per video?",
      a: "1 credit is charged to generate captions for your video. You can download SRT/VTT subtitle files and edit them manually with zero extra charge! If you want to export and download the final captioned MP4 video, 1 more credit is charged."
    },
    {
      q: "What payment methods are supported?",
      a: "We support all major Indian payment methods through Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards (Visa, Mastercard, RuPay), and Net Banking across 50+ banks."
    },
    {
      q: "What happens if AI transcription has an error or fails?",
      a: "Our system has automatic atomic refund protection. If Gemini speech recognition fails or your network drops mid-job, your credits are refunded back to your balance immediately."
    },
    {
      q: "Can I use ManaCaption for YouTube Long-form videos?",
      a: "Yes! ManaCaption supports 9:16 vertical reels/shorts as well as 16:9 widescreen YouTube videos and 1:1 square posts."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#060919] text-[#F8F3F0] flex flex-col selection:bg-[#20309A] selection:text-[#F8F3F0]">
      {/* Top Header */}
      <header className="h-16 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#20309A] via-[#384DE8] to-[#BB232B] flex items-center justify-center shadow-[0_0_15px_rgba(32,48,154,0.5)] border border-[#F8F3F0]/20 text-[#F8F3F0] font-black text-xs group-hover:scale-105 transition-transform">
              MC
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#F8F3F0] text-base tracking-tight">ManaCaption</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 font-bold shadow-[0_0_10px_rgba(187,35,43,0.3)]">
                Pricing
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/80 hover:text-white border border-[#20309A]/40 text-xs font-semibold transition-all"
          >
            <Video className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Studio</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/80 hover:text-white border border-[#20309A]/40 text-xs font-semibold transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Dashboard</span>
          </Link>

          {user && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] border border-[#BB232B]/40 text-[#F8F3F0] text-xs font-bold shadow-[0_0_12px_rgba(187,35,43,0.2)]">
              <Zap className="w-3.5 h-3.5 text-[#BB232B] fill-[#BB232B]" />
              <span>{user.credits_balance ?? 10} Credits</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Smooth vertical scrolling */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1333] border border-[#20309A]/50 text-[#F8F3F0] text-xs font-bold shadow-[0_0_15px_rgba(32,48,154,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Pay-As-You-Go Credits · Zero Forced Subscriptions</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#F8F3F0] tracking-tight leading-tight">
            Simple, Royal Pricing for <span className="bg-gradient-to-r from-[#384DE8] via-[#F8F3F0] to-[#E0353E] bg-clip-text text-transparent">Telugu Creators</span>
          </h1>

          <p className="text-sm sm:text-base text-[#F8F3F0]/70 leading-relaxed max-w-2xl mx-auto">
            Top up credits whenever you need. Every package includes dual-script Telugu subtitles, song lyrics synchronization, and 1080p MP4 exports. Credits never expire.
          </p>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs max-w-md mx-auto flex items-center gap-2 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E0353E]" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {CREDIT_PACKAGES.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? "bg-gradient-to-b from-[#0C1230] via-[#0D1438] to-[#160D26] border-2 border-[#BB232B] shadow-[0_0_35px_rgba(187,35,43,0.35)] md:-translate-y-2"
                    : "bg-[#0C1230]/70 border border-[#20309A]/40 hover:border-[#384DE8] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                }`}
              >
                {/* Popular Badge */}
                {pkg.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#20309A] to-[#BB232B] text-white font-black text-[11px] tracking-wide uppercase shadow-[0_0_15px_rgba(187,35,43,0.5)] flex items-center gap-1 border border-[#F8F3F0]/20">
                      <Sparkles className="w-3 h-3 fill-white" />
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Package Title & Price */}
                  <div>
                    <h3 className="text-lg font-bold text-[#F8F3F0]">{pkg.name}</h3>
                    <p className="text-xs text-[#F8F3F0]/60 mt-1 min-h-[32px]">{pkg.tagline}</p>
                    
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-[#F8F3F0] tracking-tight">
                        {pkg.priceDisplay}
                      </span>
                      <span className="text-xs text-[#F8F3F0]/50 font-medium">one-time</span>
                    </div>

                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#090D24] border border-[#20309A]/40 text-[#F8F3F0] text-xs font-mono font-semibold">
                      <Zap className="w-3.5 h-3.5 text-[#BB232B] fill-[#BB232B]" />
                      <span>{pkg.credits} Credits ({pkg.perCredit})</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-4 border-t border-[#20309A]/30">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#F8F3F0]/60">
                      What&apos;s Included
                    </p>
                    <ul className="space-y-2.5 text-xs text-[#F8F3F0]/85">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-[#384DE8]/20 text-[#384DE8] flex items-center justify-center shrink-0 mt-0.5 border border-[#384DE8]/40">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="pt-8">
                  <button
                    onClick={() => handleSelectPackage(pkg)}
                    disabled={isProcessing}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50 ${
                      isPopular
                        ? "bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white shadow-[0_0_25px_rgba(187,35,43,0.4)]"
                        : "bg-[#0F1746] hover:bg-[#152264] text-[#F8F3F0] border border-[#20309A]/50 shadow-[0_0_15px_rgba(32,48,154,0.2)]"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-[#BB232B] fill-[#BB232B]" />
                    <span>Get {pkg.credits} Credits</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </button>
                  <p className="text-[10px] text-center text-[#F8F3F0]/50 mt-2">
                    Instant credit top-up · UPI &amp; Cards
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Free Plan Callout */}
        <div className="rounded-3xl border border-[#20309A]/40 bg-[#0C1230]/60 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40">
                Signup Bonus
              </span>
              <h4 className="font-extrabold text-[#F8F3F0] text-base">New to ManaCaption? Start with 10 Free Credits</h4>
            </div>
            <p className="text-xs text-[#F8F3F0]/70 max-w-xl">
              Every newly verified account automatically gets 10 credits upon registration. Test audio speech recognition, choose viral karaoke presets, and export your first reel at no cost.
            </p>
          </div>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] font-bold text-xs border border-[#20309A]/50 flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#384DE8]" />
          </Link>
        </div>

        {/* Creator Usage ROI Estimator */}
        <div className="rounded-3xl border border-[#20309A]/40 bg-gradient-to-b from-[#0C1230] to-[#060919] p-6 sm:p-10 space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#F8F3F0] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#384DE8]" />
                <span>Estimate Your Monthly Production ROI</span>
              </h3>
              <p className="text-xs text-[#F8F3F0]/60 mt-1">
                Slide to see how many reels you publish and how much time and money ManaCaption saves you.
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#BB232B]">{reelsCount} Reels</span>
              <p className="text-[11px] text-[#F8F3F0]/50">per month (~{reelsCount} minutes of audio)</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={reelsCount}
              onChange={(e) => setReelsCount(Number(e.target.value))}
              className="w-full accent-[#BB232B] bg-[#090D24] h-2.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#F8F3F0]/50 font-mono">
              <span>5 Reels (Beginner)</span>
              <span>30 Reels (Daily Creator)</span>
              <span>60 Reels (Agency)</span>
              <span>100 Reels (Scale)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#20309A]/30">
            <div className="p-4 rounded-2xl bg-[#090D24] border border-[#20309A]/30 text-center">
              <span className="text-xs text-[#F8F3F0]/60">Recommended Plan</span>
              <div className="text-lg font-black text-[#F8F3F0] mt-1">{recommendedPack.name}</div>
              <span className="text-[11px] text-[#384DE8] font-semibold">{recommendedPack.priceDisplay} one-time</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D24] border border-[#20309A]/30 text-center">
              <span className="text-xs text-[#F8F3F0]/60">Cost Per Ready Reel</span>
              <div className="text-lg font-black text-emerald-400 mt-1">
                ₹{(recommendedPack.priceInr / recommendedPack.credits).toFixed(2)}
              </div>
              <span className="text-[11px] text-[#F8F3F0]/50">Fraction of hiring an editor</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D24] border border-[#20309A]/30 text-center">
              <span className="text-xs text-[#F8F3F0]/60">Manual Time Saved</span>
              <div className="text-lg font-black text-[#BB232B] mt-1">~{hoursSaved} Hours</div>
              <span className="text-[11px] text-[#F8F3F0]/50">Focus on filming &amp; storytelling</span>
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-[#F8F3F0]">Compare Every Package</h3>
            <p className="text-xs text-[#F8F3F0]/60 mt-1">Everything you need to turn raw clips into viral short-form content.</p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-[#20309A]/40 bg-[#0C1230]/50 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#20309A]/30 text-[#F8F3F0]/70 font-mono">
                  <th className="p-4 pl-6">Feature</th>
                  <th className="p-4 text-center">Starter (₹99)</th>
                  <th className="p-4 text-center bg-[#BB232B]/10 text-[#BB232B] font-bold">Creator (₹249)</th>
                  <th className="p-4 text-center">Studio (₹699)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20309A]/20 text-[#F8F3F0]/80">
                <tr>
                  <td className="p-4 pl-6 font-semibold">Credits Included</td>
                  <td className="p-4 text-center font-bold text-white">30</td>
                  <td className="p-4 text-center font-bold text-[#BB232B] bg-[#BB232B]/10">100</td>
                  <td className="p-4 text-center font-bold text-white">350</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold">Native Telugu + Bilingual English Transliteration</td>
                  <td className="p-4 text-center text-emerald-400">✔ Yes</td>
                  <td className="p-4 text-center text-emerald-400 bg-[#BB232B]/10">✔ Yes</td>
                  <td className="p-4 text-center text-emerald-400">✔ Yes</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold">Google Gemini 2.5 Flash Speech Engine</td>
                  <td className="p-4 text-center text-emerald-400">✔ Yes</td>
                  <td className="p-4 text-center text-emerald-400 bg-[#BB232B]/10">✔ Priority Queue</td>
                  <td className="p-4 text-center text-emerald-400">✔ Ultra-Fast VIP Queue</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold">Viral Karaoke Subtitle Animations</td>
                  <td className="p-4 text-center text-[#F8F3F0]/60">All Presets</td>
                  <td className="p-4 text-center text-[#BB232B] font-bold bg-[#BB232B]/10">All Presets</td>
                  <td className="p-4 text-center text-white">All Presets + Custom</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold">Full HD 1080p MP4 Video Downloads</td>
                  <td className="p-4 text-center text-emerald-400">✔ Yes</td>
                  <td className="p-4 text-center text-emerald-400 bg-[#BB232B]/10">✔ Yes</td>
                  <td className="p-4 text-center text-emerald-400">✔ Yes</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold">Free SRT &amp; VTT File Downloads</td>
                  <td className="p-4 text-center text-emerald-400">✔ Unlimited Free</td>
                  <td className="p-4 text-center text-emerald-400 bg-[#BB232B]/10">✔ Unlimited Free</td>
                  <td className="p-4 text-center text-emerald-400">✔ Unlimited Free</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold">Credit Expiration</td>
                  <td className="p-4 text-center text-emerald-400">Never</td>
                  <td className="p-4 text-center text-emerald-400 bg-[#BB232B]/10">Never</td>
                  <td className="p-4 text-center text-emerald-400">Never</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-[#F8F3F0]">Frequently Asked Questions</h3>
            <p className="text-xs text-[#F8F3F0]/60">Have questions? We have answers.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#20309A]/40 bg-[#0C1230]/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#0E1538]"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#F8F3F0]">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#BB232B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#F8F3F0]/60 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-[#F8F3F0]/70 leading-relaxed border-t border-[#20309A]/20 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Test Sandbox Simulation Modal (When Razorpay is in test/sandbox mode) */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0C1230] border border-[#20309A]/50 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#20309A]/30 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#20309A]/20 border border-[#20309A]/40 flex items-center justify-center text-[#384DE8]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F8F3F0]">Test Sandbox Checkout</h3>
                  <p className="text-[11px] text-[#F8F3F0]/60">Instant test top-up simulation</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModal(null)}
                className="w-7 h-7 rounded-lg hover:bg-[#141C48] text-[#F8F3F0]/60 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#20309A]/20 border border-[#20309A]/40 text-[#F8F3F0] text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-[#384DE8]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Development Sandbox Mode</span>
              </p>
              <p className="text-[11px] text-[#F8F3F0]/70">
                Razorpay API keys are not yet configured in .env.local. You can simulate a successful top-up right now to verify credits and transactions!
              </p>
            </div>

            <div className="bg-[#060919] border border-[#20309A]/30 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-[#F8F3F0]/60">
                <span>Selected Package</span>
                <span className="font-bold text-white">{checkoutModal.package.name}</span>
              </div>
              <div className="flex justify-between text-[#F8F3F0]/60">
                <span>Credits to Add</span>
                <span className="font-bold text-[#BB232B] font-mono">+{checkoutModal.package.credits} Credits</span>
              </div>
              <div className="flex justify-between text-[#F8F3F0]/60">
                <span>Amount</span>
                <span className="font-bold text-white">{checkoutModal.package.priceDisplay}</span>
              </div>
              <div className="flex justify-between text-[#F8F3F0]/60 pt-2 border-t border-[#20309A]/20">
                <span>Account Recipient</span>
                <span className="font-mono text-[#F8F3F0] truncate max-w-[200px]">{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setCheckoutModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#F8F3F0]/60 hover:text-white hover:bg-[#101742] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSandboxPayment}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(187,35,43,0.4)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? "Processing..." : `Simulate Payment (${checkoutModal.package.priceDisplay})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Celebration Modal */}
      {successState && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0C1230] border border-emerald-500/40 rounded-3xl w-full max-w-md p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#F8F3F0]">Payment Successful!</h3>
              <p className="text-xs text-[#F8F3F0]/70">
                Added <strong className="text-emerald-400 font-bold">{successState.creditsAdded} credits</strong> to your ManaCaption account.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#060919] border border-[#20309A]/40 text-xs space-y-2">
              <div className="flex justify-between text-[#F8F3F0]/60">
                <span>Updated Balance</span>
                <span className="font-mono font-bold text-[#BB232B] text-sm">
                  {successState.newBalance} Credits
                </span>
              </div>
              <div className="flex justify-between text-[#F8F3F0]/60">
                <span>Purchased Pack</span>
                <span className="font-semibold text-white">{successState.package.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSuccessState(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#F8F3F0]/60 hover:text-white hover:bg-[#101742] transition-colors"
              >
                Stay on Pricing
              </button>
              <Link
                href="/studio"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-lg shadow-[#20309A]/30 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Go to Studio Editor</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#20309A]/30 bg-[#060919] py-10 px-4 sm:px-8 text-xs text-[#F8F3F0]/60 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#20309A] to-[#BB232B] flex items-center justify-center text-white font-black text-[10px]">
              MC
            </div>
            <span className="font-bold text-[#F8F3F0]">ManaCaption Studio</span>
            <span>· Built for Telugu Creators</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/terms" className="hover:text-[#F8F3F0] transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#F8F3F0] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-[#384DE8] transition-colors">Dashboard</Link>
            <span>•</span>
            <Link href="/admin" className="hover:text-[#BB232B] transition-colors">Admin Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

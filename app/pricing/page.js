"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Crown,
  Sparkles,
  HelpCircle,
  Loader2,
  X
} from "lucide-react";
import GuestAuthModal from "@/components/GuestAuthModal";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState("onetime"); // 'monthly' | '3months' | 'yearly' | 'onetime'
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreeWhatsapp, setAgreeWhatsapp] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [guestAuthOpen, setGuestAuthOpen] = useState(false);

  const handleBuy = async (packId, amount) => {
    if (!user) {
      setGuestAuthOpen(true);
      return;
    }
    setLoadingPlan(packId);
    try {
      // Trigger Razorpay order creation
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: packId, amount })
      });
      const data = await res.json();
      if (data.ok && data.orderId) {
        // Razorpay checkout modal
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
          amount: data.amount,
          currency: "INR",
          name: "ManaCaptions",
          description: data.packageName,
          order_id: data.orderId,
          handler: async function (response) {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response)
            });
            const verifyData = await verifyRes.json();
            if (verifyData.ok) {
              alert("Payment successful! Your credits have been credited.");
              router.push("/studio");
            }
          },
          prefill: {
            name: user.name,
            email: user.email
          },
          theme: {
            color: "#E5C583"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert(data.error || "Could not initiate payment. Please try again.");
      }
    } catch (err) {
      console.warn("Payment checkout notice:", err);
      alert("Payment gateway initializing. Please try again shortly.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D0E12] text-[#FFFFFF] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Container Card */}
      <div className="w-full max-w-4xl bg-[#14151E] border border-[#262836] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Top Header & Tab Switcher */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0D0E14] border border-[#262836] text-xs">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-[#F3E8CE] text-black font-bold shadow-sm"
                  : "text-[#8A8E9F] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("3months")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                billingPeriod === "3months"
                  ? "bg-[#F3E8CE] text-black font-bold shadow-sm"
                  : "text-[#8A8E9F] hover:text-white"
              }`}
            >
              3 months no autoplay
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                billingPeriod === "yearly"
                  ? "bg-[#F3E8CE] text-black font-bold shadow-sm"
                  : "text-[#8A8E9F] hover:text-white"
              }`}
            >
              Yearly 2 mo free
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("onetime")}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                billingPeriod === "onetime"
                  ? "bg-[#F3E8CE] text-black font-bold shadow-sm"
                  : "text-[#8A8E9F] hover:text-white"
              }`}
            >
              One-time
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid (Exact Screenshot 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Free */}
          <div className="rounded-2xl bg-[#0D0E14] border border-[#262836] p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8E9F] font-bold block">
                Free
              </span>
              <div>
                <h3 className="text-xl font-bold text-white">Free</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-white">₹0</span>
                </div>
                <p className="text-[11px] text-[#8A8E9F] mt-1">
                  3 min / month · 3 exports · watermarked
                </p>
              </div>

              <div className="w-full h-px bg-[#1D1F2B]" />

              {/* Bullets */}
              <ul className="space-y-2 text-xs text-[#C4C7D7]">
                <li className="flex items-center gap-2">
                  <span>3 min captioning / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>3 exports / month (watermarked)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>1080p videos, up to 3 min</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>1-hour save window</span>
                </li>
                <li className="flex items-center gap-2 text-[#6B7082]">
                  <span>No Content Pack</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl bg-[#1B1D28] text-[#8A8E9F] font-semibold text-xs border border-[#2B2F42] cursor-default text-center"
            >
              Your plan
            </button>
          </div>

          {/* Card 2: Starter pack (₹199) */}
          <div className="rounded-2xl bg-[#0D0E14] border border-[#262836] p-5 flex flex-col justify-between space-y-5 relative">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#E5C583] font-bold block">
                One-Time
              </span>
              <div>
                <h3 className="text-xl font-bold text-white">Starter pack</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-white">₹199</span>
                  <span className="text-xs text-[#8A8E9F]">one-time</span>
                </div>
                <p className="text-[11px] text-[#8A8E9F] mt-1">
                  10 min · 60 days · pay once
                </p>
              </div>

              <div className="w-full h-px bg-[#1D1F2B]" />

              {/* Bullets */}
              <ul className="space-y-2 text-xs text-[#C4C7D7]">
                <li className="flex items-center gap-2">
                  <span>10 min captioning (one-time)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Unlimited watermark-free exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>4K uploads, 1080p exports, up to 5 min</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Classic templates — watermark-free export</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Use within 60 days · no subscription</span>
                </li>
                <li className="flex items-center gap-2 text-[#6B7082]">
                  <span>No Content Pack</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleBuy("pack_starter", 199)}
              disabled={loadingPlan === "pack_starter"}
              className="w-full py-2.5 rounded-xl bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              {loadingPlan === "pack_starter" ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Buy pack</span>}
            </button>
          </div>

          {/* Card 3: Bulk pack (₹399) - BEST VALUE */}
          <div className="rounded-2xl bg-[#0D0E14] border border-[#E5C583]/50 p-5 flex flex-col justify-between space-y-5 relative shadow-xl shadow-[#E5C583]/5">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#E5C583] font-bold block">
                Best Value
              </span>
              <div>
                <h3 className="text-xl font-bold text-white">Bulk pack</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-white">₹399</span>
                  <span className="text-xs text-[#8A8E9F]">one-time</span>
                </div>
                <p className="text-[11px] text-[#8A8E9F] mt-1">
                  25 min · 90 days · pay once
                </p>
              </div>

              <div className="w-full h-px bg-[#1D1F2B]" />

              {/* Bullets */}
              <ul className="space-y-2 text-xs text-[#C4C7D7]">
                <li className="flex items-center gap-2">
                  <span>25 min captioning (one-time)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Unlimited watermark-free exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>4K uploads, 1080p exports, up to 5 min</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Classic templates — watermark-free export</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Use within 90 days · no subscription</span>
                </li>
                <li className="flex items-center gap-2 text-[#6B7082]">
                  <span>No Content Pack</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleBuy("pack_bulk", 399)}
              disabled={loadingPlan === "pack_bulk"}
              className="w-full py-2.5 rounded-xl bg-[#F3E8CE] hover:bg-[#FFFFFF] text-black font-bold text-xs shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              {loadingPlan === "pack_bulk" ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Buy pack</span>}
            </button>
          </div>
        </div>

        {/* Checkboxes & Legal Notice (Exact Screenshot 1) */}
        <div className="pt-2 border-t border-[#1E202D] space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#8A8E9F] leading-relaxed">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#383C52] bg-[#0E0F15] text-[#E5C583] focus:ring-0 cursor-pointer accent-[#E5C583]"
            />
            <div>
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-[#E5C583] hover:underline">
                  Terms, Refund
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-[#E5C583] hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
              <p className="text-[10px] text-[#6B7082] mt-0.5">
                Monthly plans renew automatically at the price shown until you cancel. 3-month and yearly plans and packs are one-time payments with no auto-renewal.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#8A8E9F] leading-relaxed">
            <input
              type="checkbox"
              checked={agreeWhatsapp}
              onChange={e => setAgreeWhatsapp(e.target.checked)}
              className="mt-0.5 rounded border-[#383C52] bg-[#0E0F15] text-[#E5C583] focus:ring-0 cursor-pointer accent-[#E5C583]"
            />
            <span className="text-[10px] text-[#6B7082]">
              WhatsApp updates from ManaCaptions: payment and renewal alerts, script ideas every Monday on paid plans, a check-in about a week after your first payment, and one short question if you cancel. No offers. Reply STOP anytime.
            </span>
          </label>
        </div>
      </div>

      {/* Guest Auth Modal if not signed in */}
      <GuestAuthModal
        isOpen={guestAuthOpen}
        onClose={() => setGuestAuthOpen(false)}
        actionType="purchase"
      />
    </div>
  );
}

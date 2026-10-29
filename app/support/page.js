"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Zap,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Film,
  ChevronDown
} from "lucide-react";

const INQUIRY_CATEGORIES = [
  { id: "credits", label: "💳 Credits, Billing & Refunds", desc: "Questions about top-ups, payment confirmation, or credit balance" },
  { id: "accuracy", label: "🎙️ Telugu Transcription & Accuracy", desc: "Help with audio recognition, accents, or Romanized output" },
  { id: "custom_style", label: "🎨 Custom Reel Style Request", desc: "Want us to design a custom animated caption style for your brand?" },
  { id: "bulk_agency", label: "💼 Bulk Agency / Enterprise Plans", desc: "Volume discounts for marketing agencies and production houses" },
  { id: "bug", label: "🐛 Bug Report / Technical Issue", desc: "Report an issue with video export, timeline, or playback" },
  { id: "general", label: "💡 General Question / Feedback", desc: "Any other questions or feature ideas for ManaCaptions" }
];

export default function SupportPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("credits");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "How fast does support respond?",
      a: "Our creator success team usually replies within 2 to 4 hours during working hours (9 AM – 9 PM IST), 7 days a week."
    },
    {
      q: "What if an AI transcription failed or spent credits incorrectly?",
      a: "Our server has automatic retry and refund guards. If a job fails, credits are restored immediately. If you need any manual balance correction, message us here and our admins will credit your account directly."
    },
    {
      q: "Can I request a custom animated caption style for my page?",
      a: "Yes! Choose 'Custom Reel Style Request' above and paste a reference link (Instagram Reel, TikTok, YouTube Short). We can create dedicated presets matching your font, colors, and bounce physics."
    },
    {
      q: "Do you offer bulk packages for digital agencies or podcast teams?",
      a: "Yes! For teams processing over 100 reels a month, we offer dedicated high-speed server queues and customized credit packages."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/support/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          category,
          subject: subject || INQUIRY_CATEGORIES.find(c => c.id === category)?.label || "Creator Inquiry",
          message
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit enquiry. Please try again.");
      }

      setSubmitted(true);
      setTicketId(data.inquiryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060919] text-[#F8F3F0] flex flex-col selection:bg-[#20309A] selection:text-[#F8F3F0] relative overflow-hidden">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#20309A]/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-[#BB232B]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-[#384DE8]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo-icon.png"
            alt="ManaCaptions Logo"
            className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(56,77,232,0.5)] group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#F8F3F0] text-base sm:text-lg tracking-tight">
              Mana<span className="text-[#E0353E]">Captions</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#20309A]/30 text-[#384DE8] border border-[#20309A]/60 font-bold">
              Support
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] border border-[#20309A]/40 text-xs font-semibold transition-all hover:border-[#384DE8]/60"
          >
            <Film className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Studio</span>
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#20309A] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(32,48,154,0.4)]"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Pricing</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 relative z-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1333] border border-[#20309A]/50 text-xs text-[#F8F3F0]/90 font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Creator Helpdesk &amp; Inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F8F3F0] tracking-tight leading-tight">
            How Can We Help Your <span className="bg-gradient-to-r from-[#384DE8] via-[#F8F3F0] to-[#E0353E] bg-clip-text text-transparent">Telugu Content</span>?
          </h1>
          <p className="text-xs sm:text-sm text-[#F8F3F0]/70 max-w-lg mx-auto">
            Direct communication with the ManaCaptions team. We assist with billing, accuracy tuning, custom styles, and enterprise creator partnerships.
          </p>
        </div>

        {/* 3 Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0C1230]/70 border border-[#20309A]/30 backdrop-blur-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#20309A]/20 border border-[#20309A]/50 flex items-center justify-center text-[#384DE8]">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#F8F3F0]">Fast Response SLA</h3>
            <p className="text-xs text-[#F8F3F0]/60 leading-relaxed">
              All creator inquiries are answered within 2 to 4 business hours. No automated dead ends.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C1230]/70 border border-[#20309A]/30 backdrop-blur-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#BB232B]/20 border border-[#BB232B]/50 flex items-center justify-center text-[#E0353E]">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#F8F3F0]">Automatic Balance Shield</h3>
            <p className="text-xs text-[#F8F3F0]/60 leading-relaxed">
              If an export or transcription hiccups, our admin team can manually top up or refund credits on demand.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C1230]/70 border border-[#20309A]/30 backdrop-blur-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#E5A93C]/20 border border-[#E5A93C]/50 flex items-center justify-center text-[#E5A93C]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#F8F3F0]">Custom Style Requests</h3>
            <p className="text-xs text-[#F8F3F0]/60 leading-relaxed">
              Seen a viral caption animation on Instagram or YouTube? Send us the link and we will craft it for you.
            </p>
          </div>
        </div>

        {/* Main Form & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <div className="lg:col-span-7 bg-[#0B102B]/90 border border-[#20309A]/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {submitted ? (
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-[#F8F3F0]">Enquiry Submitted Successfully!</h2>
                <p className="text-xs sm:text-sm text-[#F8F3F0]/70 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. We have logged your request under Ticket ID:
                </p>
                <div className="inline-block px-4 py-2 rounded-xl bg-[#060919] border border-[#20309A]/60 font-mono text-sm text-[#384DE8] font-bold">
                  {ticketId}
                </div>
                <p className="text-xs text-[#F8F3F0]/50 pt-2">
                  Our team will review your message and reply directly to <span className="text-white font-medium">{email}</span>.
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                      setSubject("");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0] text-xs font-semibold border border-[#20309A]/40 transition-all"
                  >
                    Send Another Message
                  </button>
                  <Link
                    href="/studio"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#20309A] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white text-xs font-bold transition-all shadow-md"
                  >
                    Back to Studio &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F8F3F0]">Send an Inquiry</h2>
                  <p className="text-xs text-[#F8F3F0]/60 mt-0.5">Fill out the details below and we&apos;ll be in touch promptly.</p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-[#BB232B]/15 border border-[#BB232B]/40 text-[#F8F3F0] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#E0353E] shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Category Picker */}
                <div>
                  <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                    Select Topic / Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F8F3F0] focus:outline-none focus:border-[#384DE8]"
                  >
                    {INQUIRY_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#060919] text-[#F8F3F0]">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abhiram"
                      className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@example.com"
                      className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8]"
                    />
                  </div>
                </div>

                {/* Phone & Subject Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                      WhatsApp / Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief topic of your message"
                      className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8]"
                    />
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-semibold text-[#F8F3F0]/80 mb-1.5">
                    How can we help you? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue, feedback, or custom style request in detail..."
                    className="w-full bg-[#060919] border border-[#20309A]/40 rounded-xl p-3.5 text-xs text-[#F8F3F0] placeholder-[#F8F3F0]/30 focus:outline-none focus:border-[#384DE8] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#20309A] via-[#384DE8] to-[#BB232B] hover:from-[#2B3EC4] hover:to-[#D42B34] text-white font-bold text-xs shadow-[0_0_20px_rgba(32,48,154,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry to Team &rarr;</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: FAQ & Direct Contacts */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0B102B]/60 border border-[#20309A]/30 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-[#F8F3F0] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#384DE8]" />
                <span>Frequently Answered Questions</span>
              </h3>

              <div className="space-y-2.5">
                {faqs.map((f, i) => (
                  <div
                    key={i}
                    className="border border-[#20309A]/30 rounded-2xl overflow-hidden bg-[#060919]/60"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full p-3.5 text-left text-xs font-semibold text-[#F8F3F0] flex items-center justify-between gap-2 cursor-pointer hover:text-white"
                    >
                      <span>{f.q}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#384DE8] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    {openFaq === i && (
                      <div className="px-3.5 pb-3.5 text-[11px] text-[#F8F3F0]/70 leading-relaxed border-t border-[#20309A]/20 pt-2.5">
                        {f.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Email Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#20309A]/20 to-[#BB232B]/15 border border-[#20309A]/40 space-y-3">
              <h4 className="text-xs font-bold text-[#F8F3F0] uppercase tracking-wider text-[#384DE8]">
                Official Creator Inquiries
              </h4>
              <p className="text-xs text-[#F8F3F0]/70 leading-relaxed">
                Prefer direct email? Send details directly to our founders and support engineers:
              </p>
              <a
                href="mailto:hello.trygaruda@gmail.com"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#F8F3F0] hover:text-[#384DE8] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#BB232B]" />
                <span>hello.trygaruda@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#20309A]/30 py-8 px-4 text-center text-xs text-[#F8F3F0]/50 relative z-10 bg-[#060919]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="ManaCaptions" className="w-5 h-5 object-contain" />
            <span className="font-bold text-[#F8F3F0]">ManaCaptions</span>
            <span>· Telugu Captions. Made Easy.</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>•</span>
            <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


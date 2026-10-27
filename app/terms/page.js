"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, Sparkles, Scale, RefreshCcw } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#060919] text-[#F8F3F0] flex flex-col selection:bg-[#20309A] selection:text-[#F8F3F0]">
      {/* Header */}
      <header className="h-16 border-b border-[#20309A]/30 bg-[#060919]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#20309A] via-[#384DE8] to-[#BB232B] flex items-center justify-center shadow-[0_0_15px_rgba(32,48,154,0.5)] border border-[#F8F3F0]/20 text-white font-black text-xs group-hover:scale-105 transition-transform">
              MC
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#F8F3F0] text-base tracking-tight">ManaCaption</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#BB232B]/20 text-[#F8F3F0] border border-[#BB232B]/40 font-bold shadow-[0_0_10px_rgba(187,35,43,0.3)]">
                Legal
              </span>
            </div>
          </Link>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D1333] hover:bg-[#141C48] text-[#F8F3F0]/80 hover:text-white border border-[#20309A]/40 text-xs font-semibold transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#384DE8]" />
          <span>Back to App</span>
        </Link>
      </header>

      {/* Main Content - Natural vertical scrolling */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-10">
        
        {/* Title */}
        <div className="space-y-3 border-b border-[#20309A]/30 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1333] border border-[#20309A]/40 text-[#F8F3F0] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5 text-[#384DE8]" />
            <span>Last Updated: October 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#F8F3F0] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-[#F8F3F0]/70 leading-relaxed">
            Please read these terms carefully before using ManaCaption. By using our website, AI speech recognition services, and video export tools, you agree to be bound by these terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-[#F8F3F0]/80 text-sm leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#384DE8]" />
              <span>1. Overview of Service</span>
            </h2>
            <p>
              ManaCaption (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Service&rdquo;) provides automated audio transcription, dual-script Telugu captioning, karaoke subtitle styling, and video rendering tools designed for digital content creators, podcasters, and video editors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#BB232B]" />
              <span>2. Accounts, Authentication &amp; Credits</span>
            </h2>
            <p>
              To access full features and persist project files, you may sign in using Google Sign-In or verified 6-digit Email OTP. 
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-[#F8F3F0]/65">
              <li><strong>Signup Bonus:</strong> Each verified user account receives 10 promotional credits upon initial registration.</li>
              <li><strong>Credit Usage:</strong> Credits are deducted based on video duration (1 credit per minute of speech transcription) and export operations (1 credit per burned-in video export).</li>
              <li><strong>Expiration:</strong> Purchased credits do not expire as long as your account remains in good standing.</li>
              <li><strong>Non-Transferable:</strong> Credits are non-transferable between separate accounts.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#384DE8]" />
              <span>3. User Content &amp; Intellectual Property Ownership</span>
            </h2>
            <p>
              <strong className="text-white">You retain 100% full ownership, rights, and copyright to all videos, audio files, and transcripts you upload or export through ManaCaption.</strong>
            </p>
            <p>
              ManaCaption does not claim any ownership over your creative work. We only process your media temporarily to generate subtitles and render requested exports. We do not use your personal private video uploads to train public machine learning models.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-[#BB232B]" />
              <span>4. AI Accuracy &amp; Transcription Quality</span>
            </h2>
            <p>
              Our speech recognition utilizes modern multimodal AI models (such as Google Gemini 2.5 Flash and Groq Whisper). While accuracy for Telugu and Indic languages is state-of-the-art, background noise, low audio quality, overlapping speakers, or regional dialect nuances may produce occasional transcription inaccuracies.
            </p>
            <p>
              You are provided an interactive Transcript Editor to review, correct, and customize any words before rendering your final video.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#384DE8]" />
              <span>5. Payments &amp; Refund Policy</span>
            </h2>
            <p>
              Credit purchases are processed securely through Razorpay and verified payment partners. Due to the digital consumable nature of AI compute credits:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-[#F8F3F0]/65">
              <li>Purchases of credit packs are generally non-refundable once credits have been used.</li>
              <li><strong>Automatic Failure Protection:</strong> If a transcription job or video render fails due to a system error on our platform, the consumed credits are automatically refunded to your balance immediately.</li>
              <li>If you encounter a billing discrepancy or duplicate payment charge, please contact our support at <a href="mailto:hello.trygaruda@gmail.com" className="text-[#384DE8] hover:underline">hello.trygaruda@gmail.com</a> within 7 days.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#BB232B]" />
              <span>6. Prohibited Activities</span>
            </h2>
            <p>
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-[#F8F3F0]/65">
              <li>Upload content that infringes upon copyright, trademark, or intellectual property rights of any third party.</li>
              <li>Distribute defamatory, abusive, harassing, obscene, or unlawful media.</li>
              <li>Interfere with or bypass system rate limits, automated trial protections, or server security.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#20309A]/30">
            <h2 className="text-base font-bold text-white">7. Contact &amp; Inquiries</h2>
            <p className="text-xs text-[#F8F3F0]/60">
              For any legal questions, enterprise licensing, or support requests regarding these terms, please contact:
              <br />
              <span className="font-semibold text-neutral-200">ManaCaption Support Team</span>
              <br />
              Email: <a href="mailto:hello.trygaruda@gmail.com" className="text-[#384DE8] hover:underline">hello.trygaruda@gmail.com</a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#20309A]/30 bg-[#060919] py-8 px-4 sm:px-8 text-xs text-[#F8F3F0]/60 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>ManaCaption Studio · All Rights Reserved 2026</div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-[#BB232B] transition-colors">Pricing</Link>
            <span>•</span>
            <Link href="/" className="hover:text-[#384DE8] transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

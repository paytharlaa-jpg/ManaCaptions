"use client";

import React, { useState } from "react";

export default function LandingPage({
  onUploadFile,
  onLoadDemo,
  onOpenStudio,
  theme,
  setTheme
}) {
  const [selectedStyle, setSelectedStyle] = useState("karaoke");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [showAllStyles, setShowAllStyles] = useState(false);

  const faqItems = [
    {
      q: "How accurate is the Telugu AI speech transcription?",
      a: "Our Telugu speech model is tuned on conversational, code-mixed speech — the way creators actually talk. Clear audio typically lands in the 90%+ range, and you can fix anything in the editor before export."
    },
    {
      q: "What is the difference between Romanized and Native Telugu captions?",
      a: "Native Telugu captions use the Telugu alphabet (తెలుగు అక్షరాలు), while Romanized captions use the English alphabet to spell Telugu words phonetically ('Meeru ee reel ni chusara'). Both are generated automatically so you can pick whichever your audience prefers."
    },
    {
      q: "Can I edit the Telugu captions before exporting?",
      a: "Yes. Edit words, retime lines, split or merge segments, and change the style — the preview updates live before you export."
    },
    {
      q: "What video export formats are supported?",
      a: "Burned-in MP4 at up to 1080p, in 9:16, 1:1 or 16:9. You can also download the caption file (SRT / VTT) separately."
    },
    {
      q: "Are my uploaded Telugu videos kept private?",
      a: "Private by default. Only you can see your uploads, and files are deleted from processing storage once your export is ready."
    },
    {
      q: "Do I need to install any software?",
      a: "No. Everything runs in the browser, on phone or desktop. Upload, caption, export."
    },
    {
      q: "Can I customize caption fonts and colors?",
      a: "Every style is adjustable — font, size, colour, highlight, outline, position and animation. Save your set as a preset for next time."
    },
    {
      q: "What is the Custom Style feature?",
      a: "Send us a reference reel or describe the look you want. We build that caption style and add it to your account — usually within 24 hours."
    }
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadFile(file);
  };

  return (
    <div className="landing-page" data-theme={theme}>
      {/* Floating Navbar */}
      <header className="navbar">
        <div className="container nav-container">
          <a className="logo" href="/">
            <img src="/logo.png" alt="ManaCaptions" className="nav-logo-img" />
          </a>
          <nav className="nav-links">
            <a href="#upload">Product</a>
            <a href="#styles">Styles</a>
            <a href="#pricing">Pricing</a>
            <a href="#reels">Reels</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-actions">
            <button
              type="button"
              onClick={onOpenStudio}
              className="nav-dashboard-cta cursor-pointer"
            >
              Open Studio
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="theme-toggle"
              aria-label="Toggle theme"
              title="Toggle dark/light theme"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.2 14.1A8.2 8.2 0 0 1 9.9 3.8 7.4 7.4 0 1 0 20.2 14.1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onLoadDemo}
              className="btn-primary cursor-pointer"
            >
              Try Demo Reel
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero" id="top">
        <div className="lp-container">
          <div className="lp-hero-copy">
            <span className="lp-city-mark lp-city-mark--hero">
              <span className="lp-city-mark-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M6 28V14.5L8.2 12.2V8.5L10 6.8V10h2.2V6.2L16 3l3.8 3.2V10H22V6.8L23.8 8.5v3.7L26 14.5V28" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M11.2 28v-6.2c0-2.6 1.9-4.2 4.8-4.2s4.8 1.6 4.8 4.2V28" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M6 28h20M8.4 18.2h15.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lp-city-mark-copy">Made in Hyderabad for Telugu creators</span>
            </span>

            <h1 className="lp-display">
              Create <span className="lp-accent">Telugu</span> Captions in Seconds.
            </h1>

            <p className="lp-lead">
              Upload a Short, generate accurate Telugu captions, customize the style, and export a post-ready video in minutes.
            </p>
          </div>

          {/* Upload Card */}
          <div className="lp-upload-card" id="upload">
            <div
              className="lp-uploader"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              <label className="lp-uploader-drop cursor-pointer">
                <div className="lp-uploader-icons" aria-hidden="true">
                  <div className="lp-uploader-stack" />
                  <div className="lp-uploader-plus">+</div>
                </div>
                <span className="lp-uploader-title">Drop your video here or click to browse</span>
                <span className="lp-uploader-sub">Supports MP4, MOV, WebM · Auto-generates Dual Script</span>
                <input
                  type="file"
                  accept="video/*,.mp4,.mov,.mkv,.webm,.avi,.m4v"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>

            <div className="lp-upload-bar">
              <div className="lp-upload-meta">
                <span className="lp-upload-attach" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </span>
                <span className="lp-style-chip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 5h16v14H4z" />
                    <path d="M8 9h5" />
                    <path d="M8 13h8" />
                  </svg>
                  {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onLoadDemo}
                  className="lp-btn-light cursor-pointer text-xs"
                >
                  Load Demo Reel
                </button>
                <label className="lp-btn-dark cursor-pointer text-xs">
                  <span>Upload Video</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h13" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                  <input
                    type="file"
                    accept="video/*,.mp4,.mov,.mkv,.webm"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Interactive Style Strip */}
          <div className="lp-strip" role="listbox" aria-label="Caption styles">
            <button
              type="button"
              role="option"
              aria-selected={selectedStyle === "karaoke"}
              onClick={() => setSelectedStyle("karaoke")}
              className={`lp-strip-card ${selectedStyle === "karaoke" ? "is-selected" : ""}`}
            >
              <div className="lp-strip-preview lp-strip-preview--video">
                <video src="/styles/karaoke.mp4" muted loop playsInline autoPlay preload="metadata" />
                <span className="lp-strip-label">Karaoke</span>
              </div>
            </button>

            <button
              type="button"
              role="option"
              aria-selected={selectedStyle === "negative"}
              onClick={() => setSelectedStyle("negative")}
              className={`lp-strip-card ${selectedStyle === "negative" ? "is-selected" : ""}`}
            >
              <div className="lp-strip-preview lp-strip-preview--video">
                <video src="/styles/negative.mp4" muted loop playsInline autoPlay preload="metadata" />
                <span className="lp-strip-label">Negative</span>
              </div>
            </button>

            <button
              type="button"
              role="option"
              aria-selected={selectedStyle === "negative-style"}
              onClick={() => setSelectedStyle("negative-style")}
              className={`lp-strip-card ${selectedStyle === "negative-style" ? "is-selected" : ""}`}
            >
              <div className="lp-strip-preview lp-strip-preview--video">
                <video src="/styles/negative-style.mp4" muted loop playsInline autoPlay preload="metadata" />
                <span className="lp-strip-label">Negative Style</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Styles 2.0 Section */}
      <section className="lp-section" id="styles">
        <div className="lp-container">
          <div className="lp-section-intro">
            <span className="lp-eyebrow">Styles 2.0</span>
            <h2 className="lp-display-sm">14 Caption Styles</h2>
            <p className="lp-section-lead">Curated caption styles for Reels, Shorts, and social video — same set in the editor.</p>
          </div>

          <div className="lp-styles-grid">
            {/* Classic */}
            <button
              type="button"
              onClick={onLoadDemo}
              className="lp-style-card lp-style-card--classic"
            >
              <div className="lp-style-preview">
                <span className="lp-anim lp-anim-classic">
                  <span>this</span> <span>is</span> <span>how</span> <span>you</span> <span>go</span>
                </span>
              </div>
              <div className="lp-style-meta">
                <span>Classic</span>
                <span className="lp-mono-tag">Default</span>
              </div>
            </button>

            {/* Bold */}
            <button
              type="button"
              onClick={onLoadDemo}
              className="lp-style-card lp-style-card--bold"
            >
              <div className="lp-style-preview">
                <span className="lp-anim lp-anim-bold lp-style-bold">this is how you</span>
              </div>
              <div className="lp-style-meta">
                <span>Bold</span>
                <span className="lp-mono-tag">Impact</span>
              </div>
            </button>

            {/* Highlight */}
            <button
              type="button"
              onClick={onLoadDemo}
              className="lp-style-card lp-style-card--highlight"
            >
              <div className="lp-style-preview">
                <span className="lp-anim lp-anim-highlight">
                  <span>this</span> <span>is</span> <span>how</span> <span>you</span>
                </span>
              </div>
              <div className="lp-style-meta">
                <span>Highlight</span>
                <span className="lp-mono-tag">Aesthetic</span>
              </div>
            </button>

            {/* Karaoke */}
            <button
              type="button"
              onClick={onLoadDemo}
              className="lp-style-card"
            >
              <div className="lp-style-preview">
                <span className="lp-anim lp-anim-karaoke font-bold">
                  <span>viral</span> <span>reels</span> <span>captions</span>
                </span>
              </div>
              <div className="lp-style-meta">
                <span>Karaoke</span>
                <span className="lp-mono-tag">Sync</span>
              </div>
            </button>

            {showAllStyles && (
              <>
                {/* Negative */}
                <button
                  type="button"
                  onClick={onLoadDemo}
                  className="lp-style-card"
                >
                  <div className="lp-style-preview bg-black text-white">
                    <span className="font-black text-xl tracking-wider">THIS IS NOW</span>
                  </div>
                  <div className="lp-style-meta">
                    <span>Negative</span>
                    <span className="lp-mono-tag">Cutout</span>
                  </div>
                </button>

                {/* Shamani Gold */}
                <button
                  type="button"
                  onClick={onLoadDemo}
                  className="lp-style-card"
                >
                  <div className="lp-style-preview">
                    <span className="font-extrabold text-amber-400 text-lg">MEERU EE REEL NI</span>
                  </div>
                  <div className="lp-style-meta">
                    <span>Raj Shamani</span>
                    <span className="lp-mono-tag">Premium 3.0</span>
                  </div>
                </button>
              </>
            )}
          </div>

          <div className="lp-center">
            <button
              type="button"
              onClick={() => setShowAllStyles(!showAllStyles)}
              className="lp-btn-outline cursor-pointer"
            >
              <span>{showAllStyles ? "Show less" : "View more"}</span>
              <span className="lp-chev" style={{ transform: showAllStyles ? "rotate(180deg)" : "rotate(0deg)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Reels In Action Section */}
      <section className="lp-section" id="reels">
        <div className="lp-container">
          <div className="lp-section-intro">
            <span className="lp-eyebrow">In the wild</span>
            <h2 className="lp-display-sm">See Reels in Action</h2>
            <p className="lp-section-lead">See how creators use our caption styles on real videos.</p>
          </div>

          <div className="lp-reels-grid">
            <div className="lp-reel-card cursor-pointer" onClick={onLoadDemo}>
              <div className="lp-reel-preview lp-reel-preview--video">
                <video src="/styles/karaoke.mp4" muted loop playsInline autoPlay />
                <span className="lp-reel-badge">reel 1 · Karaoke</span>
              </div>
              <div className="lp-reel-meta">
                <span>@teluguhacks</span>
                <span className="lp-mono-tag lp-reel-style-btn">Karaoke</span>
              </div>
            </div>

            <div className="lp-reel-card cursor-pointer" onClick={onLoadDemo}>
              <div className="lp-reel-preview lp-reel-preview--video">
                <video src="/styles/negative.mp4" muted loop playsInline autoPlay />
                <span className="lp-reel-badge">reel 2 · Negative</span>
              </div>
              <div className="lp-reel-meta">
                <span>@sirichats</span>
                <span className="lp-mono-tag lp-reel-style-btn">Negative</span>
              </div>
            </div>

            <div className="lp-reel-card cursor-pointer" onClick={onLoadDemo}>
              <div className="lp-reel-preview lp-reel-preview--video">
                <video src="/styles/negative-style.mp4" muted loop playsInline autoPlay />
                <span className="lp-reel-badge">reel 3 · Negative</span>
              </div>
              <div className="lp-reel-meta">
                <span>@filmnotes.te</span>
                <span className="lp-mono-tag lp-reel-style-btn">Negative</span>
              </div>
            </div>

            <div className="lp-reel-card cursor-pointer" onClick={onLoadDemo}>
              <div className="lp-reel-preview lp-reel-preview--video">
                <video src="/styles/karaoke.mp4" muted loop playsInline autoPlay />
                <span className="lp-reel-badge">reel 4 · Karaoke</span>
              </div>
              <div className="lp-reel-meta">
                <span>@dailytelugu</span>
                <span className="lp-mono-tag lp-reel-style-btn">Karaoke</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="lp-section lp-pricing" id="pricing">
        <div className="lp-container">
          <div className="lp-section-intro lp-center-copy">
            <span className="lp-eyebrow">Pricing</span>
            <h2 className="lp-display-sm">Simple Pricing</h2>
            <p className="lp-section-lead">Choose the plan that fits your workflow.</p>
          </div>

          <div className="lp-pricing-grid">
            {/* Monthly */}
            <div className="lp-price-card">
              <div className="lp-price-head">
                <span className="lp-mono-tag">Monthly</span>
                <p className="lp-price">₹299<span> / month</span></p>
              </div>
              <ul className="lp-price-features">
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Unlimited videos
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  All caption styles
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Burned MP4 export
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Romanized &amp; Telugu captions
                </li>
              </ul>
              <button type="button" onClick={onOpenStudio} className="lp-btn-ghost cursor-pointer">
                Start Monthly
              </button>
            </div>

            {/* Weekly */}
            <div className="lp-price-card">
              <div className="lp-price-head">
                <span className="lp-mono-tag">Weekly</span>
                <p className="lp-price">₹59<span> / week</span></p>
              </div>
              <ul className="lp-price-features">
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  10 videos / day
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  All caption styles
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Burned MP4 export
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DE5227" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Romanized &amp; Telugu captions
                </li>
              </ul>
              <button type="button" onClick={onOpenStudio} className="lp-btn-ghost cursor-pointer">
                Start Weekly
              </button>
            </div>

            {/* Featured Pay-Per-Video */}
            <div className="lp-price-card lp-price-featured">
              <div className="lp-price-head">
                <span className="lp-best-badge">Best to start</span>
                <span className="lp-mono-tag">Pay per video</span>
                <p className="lp-price lp-price-light">₹9<span> / video</span></p>
              </div>
              <ul className="lp-price-features lp-price-features-light">
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  1 video, no subscription
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  All caption styles
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Burned MP4 export
                </li>
                <li>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FF7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Romanized &amp; Telugu captions
                </li>
              </ul>
              <button type="button" onClick={onLoadDemo} className="lp-btn-light cursor-pointer">
                Try One Video
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="lp-section" id="faq">
        <div className="lp-container lp-faq-grid">
          <div className="lp-faq-intro">
            <span className="lp-eyebrow">FAQ</span>
            <h2 className="lp-display-sm">Frequently Asked Questions</h2>
          </div>
          <div className="lp-faq-list">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`lp-faq-item ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="lp-faq-trigger"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="lp-faq-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && <p className="lp-faq-answer">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Wrap */}
      <section className="lp-cta-wrap">
        <div className="lp-container">
          <div className="lp-cta-card">
            <span className="lp-eyebrow lp-cta-eyebrow">Ready to publish?</span>
            <h2 className="lp-display-sm lp-cta-title">Caption your next Short in minutes.</h2>
            <p className="lp-cta-subtitle">Upload once, style instantly, and export a creator-ready video in one flow.</p>
            <button
              type="button"
              onClick={onLoadDemo}
              className="lp-btn-dark lp-cta-btn cursor-pointer"
            >
              Upload Video
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h13" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
            <div className="lp-cta-points" aria-label="ManaCaptions benefits">
              <span>Telugu + Romanized</span>
              <span>Style presets</span>
              <span>Burned MP4 export</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <a className="logo" href="/">
                <img src="/logo.png" alt="ManaCaptions" className="nav-logo-img" />
              </a>
              <p>AI captions for Telugu creators.</p>
            </div>
            <div className="lp-footer-col">
              <span className="lp-mono-tag">Product</span>
              <a href="#styles">Styles</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="lp-footer-col">
              <span className="lp-mono-tag">Legal</span>
              <a href="#faq">Privacy</a>
              <a href="#faq">Terms</a>
            </div>
            <div className="lp-footer-col">
              <span className="lp-mono-tag">Contact</span>
              <a href="mailto:hello@manacaptions.com">hello@manacaptions.com</a>
              <button type="button" onClick={onOpenStudio} className="text-left cursor-pointer hover:underline">
                Open Studio
              </button>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2026 ManaCaptions</span>
            <span className="lp-city-mark lp-city-mark--default">
              <span className="lp-city-mark-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M6 28V14.5L8.2 12.2V8.5L10 6.8V10h2.2V6.2L16 3l3.8 3.2V10H22V6.8L23.8 8.5v3.7L26 14.5V28" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M11.2 28v-6.2c0-2.6 1.9-4.2 4.8-4.2s4.8 1.6 4.8 4.2V28" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M6 28h20M8.4 18.2h15.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
              <span className="lp-city-mark-copy">
                <b>Made in Hyderabad</b>
                <small>made for Telugu creators</small>
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

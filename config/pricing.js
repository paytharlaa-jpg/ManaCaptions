/**
 * TELUGU CAPTIONS STUDIO - PRICING & CREDITS CONFIGURATION
 * Single source of truth for credit pricing, rate rules, and usage limits.
 */

export const PRICING_RULES = {
  // Credits granted once upon signup (or initial migration for existing users)
  SIGNUP_BONUS_CREDITS: 10,

  // Caption generation rate: 1 credit per minute (ceil: 1-60s = 1 credit, 61-120s = 2 credits)
  CAPTION_CREDITS_PER_MINUTE: 1,

  // Translation rate: 0.5 credits per minute per language (round up)
  TRANSLATION_CREDITS_PER_MINUTE: 0.5,

  // Burned-in MP4 video rendering & download: 100% Free once transcribed!
  BURNED_VIDEO_EXPORT_CREDITS_PER_MINUTE: 0,

  // Subtitle file download (SRT / VTT): Free for manual editing
  SRT_EXPORT_CREDITS: 0,

  // Helper: Calculate caption generation credits (1 credit per minute)
  calculateCaptionCost: (durationSec) => {
    const sec = Math.max(1, Number(durationSec) || 30);
    return Math.max(1, Math.ceil(sec / 60));
  },

  // Helper: Calculate translation credits from duration in seconds & language count
  calculateTranslationCost: (durationSec, numLanguages = 1) => {
    const sec = Math.max(1, Number(durationSec) || 1);
    const minutes = Math.ceil(sec / 60);
    return Math.max(1, Math.ceil(minutes * PRICING_RULES.TRANSLATION_CREDITS_PER_MINUTE * numLanguages));
  },

  // Helper: Calculate export cost (Free - 0 credits)
  calculateExportCost: () => {
    return 0;
  },

  // Video Constraints (Shorts & Reels Standard)
  MAX_VIDEO_DURATION_SEC: 120, // 2 minutes max
  MAX_FILE_SIZE_MB: 100, // 100 MB max

  // Guest Trial Limits
  GUEST_TRIAL_LIMITS: {
    MAX_TRIALS_PER_SESSION: 1,
    MAX_VIDEO_DURATION_SEC: 120, // 2 minutes max for trial
    MAX_FILE_SIZE_MB: 100, // 100 MB max
    MAX_TRIALS_PER_IP_24H: 2,
    CLEANUP_HOURS: 48
  }
};

export const CREDIT_PACKAGES = [
  {
    id: "pack_starter",
    name: "Starter Pack",
    credits: 30,
    priceInr: 99,
    priceDisplay: "₹99",
    tagline: "Perfect for testing & trying viral styles",
    popular: false,
    perCredit: "₹3.30 / credit",
    features: [
      "30 Credits included",
      "Up to 30 Reels / Shorts",
      "Native Telugu + Bilingual transliteration",
      "Unlimited 1080p MP4 exports (Free)",
      "Free SRT & VTT subtitle downloads",
      "Credits never expire"
    ]
  },
  {
    id: "pack_creator",
    name: "Creator Pack",
    credits: 100,
    priceInr: 249,
    priceDisplay: "₹249",
    tagline: "Most popular for Instagram & YouTube creators",
    popular: true,
    badge: "Most Popular",
    perCredit: "₹2.49 / credit",
    features: [
      "100 Credits included",
      "Up to 100 Reels / Shorts",
      "Priority AI transcription queue",
      "All viral karaoke animation styles",
      "Unlimited 1080p MP4 exports (Free)",
      "Free SRT & VTT subtitle downloads",
      "Credits never expire"
    ]
  },
  {
    id: "pack_studio",
    name: "Studio Pack",
    credits: 350,
    priceInr: 699,
    priceDisplay: "₹699",
    tagline: "Best value for agencies & heavy volume creators",
    popular: false,
    badge: "Save 40%",
    perCredit: "₹1.99 / credit",
    features: [
      "350 Credits included",
      "Up to 350 Reels / Shorts",
      "Fastest AI speech recognition",
      "Custom brand colors & styling presets",
      "Unlimited 1080p MP4 exports (Free)",
      "VIP priority creator support",
      "Credits never expire"
    ]
  }
];

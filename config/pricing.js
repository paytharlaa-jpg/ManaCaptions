/**
 * TELUGU CAPTIONS STUDIO - PRICING & CREDITS CONFIGURATION
 * Single source of truth for credit pricing, rate rules, and usage limits.
 */

export const PRICING_RULES = {
  // Credits granted once upon signup (or initial migration for existing users)
  SIGNUP_BONUS_CREDITS: 10,

  // Caption generation rate: 1 credit flat per video
  CAPTION_CREDITS_PER_VIDEO: 1,

  // Translation rate: 0.5 credits per minute per language (round up)
  TRANSLATION_CREDITS_PER_MINUTE: 0.5,

  // Burned-in MP4 video rendering & download: 1 credit per export
  BURNED_VIDEO_EXPORT_CREDITS: 1,

  // Subtitle file download (SRT / VTT): Free for manual editing
  SRT_EXPORT_CREDITS: 0,

  // Helper: Calculate caption generation credits (1 credit flat)
  calculateCaptionCost: () => {
    return PRICING_RULES.CAPTION_CREDITS_PER_VIDEO;
  },

  // Helper: Calculate translation credits from duration in seconds & language count
  calculateTranslationCost: (durationSec, numLanguages = 1) => {
    const sec = Math.max(1, Number(durationSec) || 1);
    const minutes = Math.ceil(sec / 60);
    return Math.max(1, Math.ceil(minutes * PRICING_RULES.TRANSLATION_CREDITS_PER_MINUTE * numLanguages));
  },

  // Helper: Calculate export cost (1 credit flat)
  calculateExportCost: () => {
    return PRICING_RULES.BURNED_VIDEO_EXPORT_CREDITS;
  },

  // Phase 6 Integration: Guest Trial Limits
  GUEST_TRIAL_LIMITS: {
    MAX_TRIALS_PER_SESSION: 1,
    MAX_VIDEO_DURATION_SEC: 120, // 2 minutes max for trial
    MAX_FILE_SIZE_MB: 100, // 100 MB placeholder
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
      "~30 Minutes of auto-captions",
      "Native Telugu + Bilingual transliteration",
      "Universal MP4 export with burned-in subtitles",
      "Free SRT/VTT downloads",
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
      "~100 Minutes of auto-captions",
      "Priority AI transcription queue",
      "All viral karaoke animation styles",
      "Full HD 1080p MP4 exports",
      "Free SRT/VTT downloads",
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
      "~350 Minutes of auto-captions",
      "Fastest AI speech recognition",
      "Custom brand colors & styling presets",
      "Full HD 1080p MP4 exports",
      "VIP priority creator support",
      "Credits never expire"
    ]
  }
];

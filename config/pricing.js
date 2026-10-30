/**
 * TELUGU CAPTIONS STUDIO - PRICING & CREDITS CONFIGURATION
 * Single source of truth for credit pricing, rate rules, and usage limits.
 */

export const PRICING_RULES = {
  // Credits granted once upon signup (or initial migration for existing users)
  SIGNUP_BONUS_CREDITS: 10,

  // Subtitle file download (SRT / VTT): Free
  SRT_EXPORT_CREDITS: 0,

  // Helper: Calculate caption generation credits dynamically by video duration in seconds
  calculateCaptionCost: (durationSec) => {
    const sec = Math.max(1, Number(durationSec) || 30);
    // Dynamic scaling by seconds length (e.g. up to 30s = 1, up to 60s = 2, up to 90s = 3, up to 120s = 4)
    return Math.max(1, Math.ceil(sec / 30));
  },

  // Helper: Calculate translation credits from duration in seconds & language count
  calculateTranslationCost: (durationSec, numLanguages = 1) => {
    const sec = Math.max(1, Number(durationSec) || 30);
    const base = Math.max(1, Math.ceil(sec / 30));
    return Math.max(1, Math.ceil(base * 0.5 * numLanguages));
  },

  // Helper: Calculate video render & download cost dynamically by video duration in seconds
  calculateExportCost: (durationSec) => {
    const sec = Math.max(1, Number(durationSec) || 30);
    // Dynamic scaling by seconds length
    return Math.max(1, Math.ceil(sec / 30));
  },

  // Video Constraints (Shorts & Reels Standard)
  MAX_VIDEO_DURATION_SEC: 120, // 2 minutes max
  MAX_FILE_SIZE_MB: 100, // 100 MB max

  // Guest Trial Limits
  GUEST_TRIAL_LIMITS: {
    MAX_TRIALS_PER_SESSION: 1,
    MAX_VIDEO_DURATION_SEC: 120,
    MAX_FILE_SIZE_MB: 100,
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
      "30 Studio Credits",
      "Native Telugu + Bilingual transliteration",
      "Full access to viral karaoke presets",
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
      "100 Studio Credits",
      "Priority AI speech queue",
      "All viral motion & karaoke presets",
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
    tagline: "Best value for agencies & high-volume creators",
    popular: false,
    badge: "Save 40%",
    perCredit: "₹1.99 / credit",
    features: [
      "350 Studio Credits",
      "Fastest dedicated speech recognition",
      "All custom animated presets",
      "Free SRT & VTT subtitle downloads",
      "VIP creator support",
      "Credits never expire"
    ]
  }
];

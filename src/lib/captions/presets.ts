import { DEFAULT_STYLE, normalizeStyle, type CaptionStyle, type PRESET_IDS } from "./style-schema";
export type CaptionPresetId = (typeof PRESET_IDS)[number];

export interface CaptionPreset {
  id: CaptionPresetId;
  name: string;
  description: string;
  /** Classes for the caption container. */
  container: string;
  /** Classes for each word. */
  word: string;
  /** Classes for the currently spoken word. */
  active: string;
  defaults?: Partial<CaptionStyle>;
}

// Caption overlay colors are fixed because they sit on top of arbitrary video
// frames, not on app surfaces; they are scoped to this module only.
export const CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: "bold-pop",
    name: "Bold Pop",
    description: "Big punchy words that pop in",
    container: "text-3xl font-extrabold uppercase [text-shadow:0_3px_0_rgb(0_0_0/0.9)]",
    word: "text-[#fff]",
    active: "text-[#ffb020] animate-word-pop inline-block",
  },
  {
    id: "karaoke",
    name: "Karaoke",
    description: "Highlights each word as it is spoken",
    container: "text-2xl font-bold [text-shadow:0_2px_6px_rgb(0_0_0/0.8)]",
    word: "text-[#fff]/60",
    active: "text-[#fff]",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, small and calm",
    container: "text-lg font-medium [text-shadow:0_1px_4px_rgb(0_0_0/0.9)]",
    word: "text-[#fff]",
    active: "text-[#fff]",
  },
  {
    id: "boxed",
    name: "Boxed",
    description: "Readable text on a dark box",
    container: "text-xl font-semibold bg-[#000]/75 rounded-lg px-3 py-1.5",
    word: "text-[#fff]",
    active: "text-[#ffd84d]",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Glowing creator style",
    container: "text-2xl font-bold [text-shadow:0_0_12px_rgb(255_120_40/0.9)]",
    word: "text-[#ffe6d1]",
    active: "text-[#fff] [text-shadow:0_0_18px_rgb(255_160_40)]",
  },
  {
    id: "cinema",
    name: "Cinema",
    description: "Subtle film subtitle look",
    container: "text-lg italic tracking-wide [text-shadow:0_2px_3px_rgb(0_0_0)]",
    word: "text-[#f4f1e8]",
    active: "text-[#f4f1e8]",
  },
  { id: "podcast-pro", name: "Podcast Pro", description: "Bold speech with a readable background", container: "", word: "", active: "" },
  { id: "social-creator", name: "Social Creator", description: "High-contrast captions for social video", container: "", word: "", active: "" },
  { id: "viral-punch", name: "Viral Punch", description: "Large type and impactful highlighted words", container: "", word: "", active: "" },
];

const OVERRIDES: Record<CaptionPresetId, Partial<CaptionStyle>> = {
  "bold-pop": {}, karaoke: { animation: "karaoke", highlightColor: "#FFD84D", fontSize: 36 },
  minimal: { fontWeight: 400, fontSize: 26, outlineWidth: 0, animation: "none", displayMode: "sentence", highlightColor: "#FFFFFF" },
  boxed: { backgroundOpacity: 0.75, highlightColor: "#FFD84D", fontSize: 32, animation: "none" },
  neon: { shadowColor: "#25C6DA", shadowBlur: 18, highlightColor: "#25C6DA", animation: "fade", fontSize: 36 },
  cinema: { fontFamily: "Noto Serif Telugu", fontWeight: 400, fontSize: 26, displayMode: "sentence", animation: "none", highlightColor: "#FFFFFF" },
  "podcast-pro": { fontWeight: 600, fontSize: 34, backgroundOpacity: 0.8, highlightColor: "#25C6DA", animation: "fade" },
  "social-creator": { backgroundOpacity: 0.65, highlightColor: "#FFD84D", animation: "slide", fontSize: 38 },
  "viral-punch": { fontSize: 58, outlineWidth: 2, highlightColor: "#FFD84D", animation: "pop" },
};
export function presetStyle(id: string): CaptionStyle {
  const preset = getPreset(id);
  return normalizeStyle({ ...DEFAULT_STYLE, ...OVERRIDES[preset.id], presetId: preset.id });
}

export function getPreset(id: string): CaptionPreset {
  const found = CAPTION_PRESETS.find((p) => p.id === id) ?? CAPTION_PRESETS.find((p) => p.id === "bold-pop");
  if (!found) throw new Error("Default caption preset is missing");
  return found;
}

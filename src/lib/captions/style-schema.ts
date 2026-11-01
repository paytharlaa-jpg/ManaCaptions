import { z } from "zod";
import { FONT_REGISTRY } from "./font-registry";

const color = z.string().regex(/^#[\da-f]{6}$/i).transform((s) => s.toUpperCase());
export const PRESET_IDS = ["bold-pop", "karaoke", "minimal", "boxed", "neon", "cinema", "podcast-pro", "social-creator", "viral-punch"] as const;
export const captionStyleSchema = z.object({
  presetId: z.enum(PRESET_IDS),
  fontFamily: z.string().refine((s) => FONT_REGISTRY.some((f) => f.family === s)),
  fontWeight: z.number().int(),
  fontSize: z.number().min(12).max(120),
  textColor: color, highlightColor: color, backgroundColor: color,
  backgroundOpacity: z.number().min(0).max(1),
  outlineColor: color, outlineWidth: z.number().min(0).max(8),
  shadowColor: color, shadowBlur: z.number().min(0).max(30),
  shadowOffsetX: z.number().min(-20).max(20), shadowOffsetY: z.number().min(-20).max(20),
  position: z.enum(["top", "center", "bottom", "custom"]),
  customPositionX: z.number().min(5).max(95), customPositionY: z.number().min(5).max(95),
  alignment: z.enum(["left", "center", "right"]),
  displayMode: z.enum(["word", "sentence"]),
  animation: z.enum(["none", "pop", "fade", "slide", "karaoke"]),
  lineSpacing: z.number().min(1).max(2), characterSpacing: z.number().min(0).max(10),
}).superRefine((style, ctx) => {
  const font = FONT_REGISTRY.find((f) => f.family === style.fontFamily);
  if (!font?.weights.some((w) => w === style.fontWeight)) ctx.addIssue({ code: "custom", path: ["fontWeight"], message: "Unsupported font weight" });
});
export type CaptionStyle = z.infer<typeof captionStyleSchema>;
export function normalizeStyle(value: unknown): CaptionStyle { return captionStyleSchema.parse(value); }
export function serializeStyle(value: unknown): string { return JSON.stringify(normalizeStyle(value)); }

export const DEFAULT_STYLE: CaptionStyle = {
  presetId: "bold-pop", fontFamily: "Noto Sans Telugu", fontWeight: 800, fontSize: 42,
  textColor: "#FFFFFF", highlightColor: "#FFB020", backgroundColor: "#000000", backgroundOpacity: 0,
  outlineColor: "#000000", outlineWidth: 1, shadowColor: "#000000", shadowBlur: 4,
  shadowOffsetX: 0, shadowOffsetY: 3, position: "bottom", customPositionX: 50, customPositionY: 85,
  alignment: "center", displayMode: "word", animation: "pop", lineSpacing: 1.3, characterSpacing: 0,
};
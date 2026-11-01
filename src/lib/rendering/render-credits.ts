import type { Resolution } from "./render-validation";
export interface RenderPricing { approved: boolean; creditsPerMinute: Record<Resolution, number> }
export function estimateRenderCredits(seconds: number, resolution: Resolution, pricing: RenderPricing | null) {
  if (!pricing?.approved) return null;
  const rate = pricing.creditsPerMinute[resolution];
  if (!Number.isFinite(seconds) || seconds <= 0 || !Number.isInteger(rate) || rate <= 0) throw new Error("Invalid rendering price");
  return Math.ceil(seconds / 60) * rate;
}
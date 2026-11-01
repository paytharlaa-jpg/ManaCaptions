import { z } from "zod";
export const productSettingsSchema = z.object({
  maxVideoSeconds: z.number().int().min(1).max(300),
  transcriptionCreditsPerMinute: z.number().int().min(1).max(100),
  renderingCreditsPerMinute: z.object({ "720p": z.number().int().min(1).max(1000), "1080p": z.number().int().min(1).max(1000), "4k": z.number().int().min(1).max(1000) }).nullable(),
  renderPricingApproved: z.literal(false),
  freeResolution: z.literal("1080p"), paidResolution: z.literal("4k"),
  sourceRetentionHours: z.literal(72), outputRetentionHours: z.literal(24),
  renderingProvider: z.literal("unconfigured"), emailProvider: z.literal("unconfigured"),
});
export const DEFAULT_PRODUCT_SETTINGS: z.infer<typeof productSettingsSchema> = {
  maxVideoSeconds: 300, transcriptionCreditsPerMinute: 1, renderingCreditsPerMinute: null,
  renderPricingApproved: false, freeResolution: "1080p", paidResolution: "4k", sourceRetentionHours: 72,
  outputRetentionHours: 24, renderingProvider: "unconfigured", emailProvider: "unconfigured",
};
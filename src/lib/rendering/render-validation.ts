import { z } from "zod";
import { MAX_AUDIO_SECONDS } from "@/lib/credits";
export const resolutionSchema = z.enum(["720p", "1080p", "4k"]);
export type Resolution = z.infer<typeof resolutionSchema>;
export const RESOLUTIONS = { "720p": { width: 1280, height: 720 }, "1080p": { width: 1920, height: 1080 }, "4k": { width: 3840, height: 2160 } };
export function authorizeResolution(resolution: Resolution, hasPaidPurchase: boolean) {
  if (resolution === "4k" && !hasPaidPurchase) throw new Error("A paid credit package is required for 4K");
}
export function validateRenderDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_AUDIO_SECONDS) throw new Error("Rendering requires a video of five minutes or less");
}
export function outputDimensions(resolution: Resolution, sourceWidth: number, sourceHeight: number) {
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth < 2 || sourceHeight < 2) throw new Error("Source dimensions are unavailable");
  const target = RESOLUTIONS[resolution];
  const landscape = sourceWidth >= sourceHeight;
  const scale = Math.min(1, (landscape ? target.width : target.height) / sourceWidth, (landscape ? target.height : target.width) / sourceHeight);
  return { width: Math.max(2, Math.floor(sourceWidth * scale / 2) * 2), height: Math.max(2, Math.floor(sourceHeight * scale / 2) * 2) };
}
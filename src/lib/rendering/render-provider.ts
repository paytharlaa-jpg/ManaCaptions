import type { CaptionStyle } from "@/lib/captions/style-schema";
import type { TranscriptSegment } from "@/lib/captions/types";
export interface RenderRequest {
  projectId: string; userId: string; sourceStoragePath: string; duration: number;
  width: number; height: number; fps: number; codec: "h264"; audio: "aac";
  segments: TranscriptSegment[]; language: string; script: "telugu" | "roman";
  style: CaptionStyle; idempotencyKey: string; ass: string;
}
export interface RenderStatus { status: "queued" | "processing" | "completed" | "failed" | "cancelled"; progress: number | null; errorCode?: string }
export interface RenderingProvider {
  id: string;
  validateRenderRequest(input: RenderRequest): Promise<void>;
  estimateRenderCost(input: RenderRequest): Promise<{ amount: number; currency: string } | null>;
  createRenderJob(input: RenderRequest): Promise<{ providerJobId: string }>;
  getRenderJobStatus(id: string): Promise<RenderStatus>;
  cancelRenderJob?(id: string): Promise<void>;
  retrieveRenderedAsset(id: string): Promise<{ url: string; expiresAt: string }>;
}
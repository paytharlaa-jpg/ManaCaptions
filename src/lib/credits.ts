/** 1 credit = 1 started minute of audio. */
export const MAX_AUDIO_SECONDS = 5 * 60;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];

export function creditsForDuration(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 1;
  return Math.max(1, Math.ceil(seconds / 60));
}

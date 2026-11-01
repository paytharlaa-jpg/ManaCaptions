export const SOURCE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
export const OUTPUT_RETENTION_MS = 24 * 60 * 60 * 1000;
export function sourceExpired(uploadedAt: string, active: boolean, now: number) {
  return !active && now >= Date.parse(uploadedAt) + SOURCE_RETENTION_MS;
}
export function outputExpired(completedAt: string, now: number) { return now >= Date.parse(completedAt) + OUTPUT_RETENTION_MS; }
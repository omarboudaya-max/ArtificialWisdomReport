const hits = new Map<string, number[]>();
/** Best-effort in-memory sliding-window limiter (per serverless instance). */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { hits.set(key, arr); return false; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return true;
}
export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "anon";

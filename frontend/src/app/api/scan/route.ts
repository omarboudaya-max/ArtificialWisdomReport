import { runUrlScan } from "@/lib/engine/url-scan";
import { computeScore } from "@/lib/engine/scoring";
import { buildFindings } from "@/lib/engine/recommendations";
import { ndjsonStream } from "@/lib/ndjson";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { CheckResult } from "@/lib/engine/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  if (!url || typeof url !== "string" || url.length > 500) return Response.json({ error: "A valid URL is required" }, { status: 400 });
  if (!rateLimit(`scan:${clientIp(req)}`, 6, 60_000)) return Response.json({ error: "Too many scans — please wait a minute." }, { status: 429 });
  return ndjsonStream(async (emit) => {
    const t0 = Date.now();
    emit({ type: "stage", stage: "url_scan", message: `Scanning ${url}` });
    const checks: CheckResult[] = [];
    const r = await runUrlScan(url, (c) => { checks.push(c); emit({ type: "check", check: c }); });
    if (r.meta.error && !checks.length) throw new Error(r.meta.error);
    const summary = computeScore(checks);
    const findings = buildFindings(checks, summary.awGti).slice(0, 8);
    emit({ type: "done", summary, durationMs: Date.now() - t0, meta: r.meta, findings });
  });
}

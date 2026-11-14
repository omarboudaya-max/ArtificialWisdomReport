import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runUrlScan } from "./engine/url-scan";
import { computeScore } from "./engine/scoring";
import { notifyWebhook } from "./webhook";

interface Sys { id: string; org_id: string; name: string; url: string | null }

export async function monitorSystem(admin: SupabaseClient, s: Sys) {
  const events: { severity: string; kind: string; message: string; data?: Record<string, unknown> }[] = [];
  // credential expiry
  const { data: creds } = await admin.from("credentials").select("id, code, tier, expires_at").eq("system_id", s.id).eq("status", "active");
  for (const c of creds ?? []) {
    const days = Math.floor((new Date(c.expires_at).getTime() - Date.now()) / 86_400_000);
    if (days < 0) {
      await admin.from("credentials").update({ status: "expired" }).eq("id", c.id);
      events.push({ severity: "high", kind: "credential_expired", message: `Credential ${c.code} expired — reassessment required`, data: { code: c.code } });
    } else if (days <= 14) events.push({ severity: "medium", kind: "credential_expiring", message: `Credential ${c.code} expires in ${days} day(s)`, data: { code: c.code, days } });
  }
  if (s.url) {
    const scan = await runUrlScan(s.url);
    const summary = computeScore(scan.checks);
    const failed = scan.checks.filter((c) => c.status === "fail").map((c) => c.key);
    const { data: prev } = await admin.from("monitoring_events").select("data").eq("system_id", s.id).eq("kind", "scan").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const p = (prev?.data ?? {}) as { score?: number; failed?: string[] };
    events.push({ severity: "info", kind: "scan", message: `Surface re-scan: ${summary.awGti ?? "n/a"} (${failed.length} failing checks)`, data: { score: summary.awGti, failed, latency: scan.meta.latency, error: scan.meta.error } });
    if (scan.meta.error) events.push({ severity: "high", kind: "availability", message: `${s.name} unreachable: ${scan.meta.error}` });
    if (p.score != null && summary.awGti != null && summary.awGti < p.score - 5)
      events.push({ severity: "high", kind: "drift", message: `Surface score dropped ${(p.score - summary.awGti).toFixed(1)} points (${p.score} → ${summary.awGti})`, data: { from: p.score, to: summary.awGti } });
    const newly = failed.filter((k) => !(p.failed ?? []).includes(k));
    if (p.failed && newly.length) {
      const names = scan.checks.filter((c) => newly.includes(c.key)).map((c) => c.name);
      events.push({ severity: scan.checks.some((c) => newly.includes(c.key) && c.gate) ? "critical" : "medium", kind: "regression", message: `New failing checks: ${names.join(", ")}`, data: { keys: newly } });
    }
    const days = scan.meta.tls?.daysRemaining;
    if (days != null && days < 21) events.push({ severity: days < 7 ? "critical" : "medium", kind: "certificate", message: `TLS certificate expires in ${days} day(s)` });
  }
  if (events.length) await admin.from("monitoring_events").insert(events.map((e) => ({ ...e, org_id: s.org_id, system_id: s.id, data: e.data ?? {} })));
  const serious = events.filter((e) => e.severity === "critical" || e.severity === "high");
  if (serious.length) await notifyWebhook(admin, s.org_id, `${s.name}: ${serious.map((e) => e.message).join(" | ")}`);
  return events;
}

/** Daily sweep: expire credentials platform-wide, then re-scan every monitored system within a time budget. */
export async function runMonitoringSweep(admin: SupabaseClient, budgetMs = 270_000) {
  await admin.from("credentials").update({ status: "expired" }).eq("status", "active").lt("expires_at", new Date().toISOString());
  const { data: systems } = await admin.from("ai_systems").select("id, org_id, name, url").eq("monitoring_enabled", true).limit(200);
  const queue = [...(systems ?? [])];
  let monitored = 0, failed = 0;
  const started = Date.now();
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length && Date.now() - started < budgetMs) {
      const s = queue.shift()!;
      try { await monitorSystem(admin, s); monitored++; } catch (e) { failed++; console.error("monitor", s.id, e); }
    }
  }));
  return { monitored, failed, remaining: queue.length };
}

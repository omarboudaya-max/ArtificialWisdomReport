import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { Empty, PageHeader, SeverityBadge } from "@/components/ui/Badges";
import { updateFinding } from "../actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import type { Recommendation } from "@/lib/engine/types";

export const metadata = { title: "Corrective actions" };

export default async function Findings({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string; system?: string }> }) {
  const sp = await searchParams;
  const { supabase, org, canEdit } = await requireOrg();
  let q = supabase.from("findings").select("*, ai_systems(name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(300);
  const status = sp.status ?? "active";
  if (status === "active") q = q.in("status", ["open", "in_progress"]);
  else if (status !== "all") q = q.eq("status", status);
  if (sp.severity) q = q.eq("severity", sp.severity);
  if (sp.system) q = q.eq("system_id", sp.system);
  const { data } = await q;
  // keep only the latest finding per (system, check)
  const seen = new Set<string>();
  const rows = (data ?? []).filter((f) => { const k = `${f.system_id}:${f.check_key}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  rows.sort((a, b) => rank[a.severity] - rank[b.severity] || Number(b.projected_uplift ?? 0) - Number(a.projected_uplift ?? 0));
  const filter = (k: string, v: string | undefined) => {
    const p = new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(sp.severity ? { severity: sp.severity } : {}), ...(sp.system ? { system: sp.system } : {}) });
    if (v) p.set(k, v); else p.delete(k);
    return `/app/findings?${p.toString()}`;
  };
  return (
    <>
      <PageHeader eyebrow="Intelligent corrective-action system" title="Corrective actions" subtitle="Every failed metric with its measured value, threshold, reason, fix, evidence required, retest procedure and projected AW-GTI uplift." />
      <div className="mb-5 flex flex-wrap gap-2 text-xs">
        {["active", "open", "in_progress", "resolved", "accepted_risk", "all"].map((s) => <Link key={s} href={filter("status", s)} className={`rounded-lg border px-3 py-1.5 font-semibold ${status === s ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 text-ink-300"}`}>{s.replace("_", " ")}</Link>)}
        <span className="mx-2 border-s border-white/10" />
        {["critical", "high", "medium", "low"].map((s) => <Link key={s} href={filter("severity", sp.severity === s ? undefined : s)} className={`rounded-lg border px-3 py-1.5 font-semibold ${sp.severity === s ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 text-ink-300"}`}>{s}</Link>)}
      </div>
      {!rows.length ? <Empty title="No corrective actions match">Run an assessment to generate prioritised recommendations.</Empty> : (
        <div className="space-y-3">
          {rows.map((f) => {
            const rec = f.recommendation as Recommendation;
            return (
              <details key={f.id} className="card group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                  <SeverityBadge severity={f.severity} />
                  <div className="min-w-0 flex-1"><div className="font-medium">{f.title}</div><div className="text-xs text-ink-400">{(f.ai_systems as unknown as { name: string })?.name} · {f.measured}</div></div>
                  {Number(f.projected_uplift) > 0 && <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300 normal-case tracking-normal"><TrendingUp size={11} /> +{f.projected_uplift}</span>}
                  <span className="chip border-white/10 text-ink-300">{f.status.replace("_", " ")}</span>
                  {f.due_date && <span className="text-xs text-ink-400">due {f.due_date}</span>}
                </summary>
                <div className="grid gap-5 border-t border-white/[0.06] p-4 text-sm lg:grid-cols-[1.3fr_1fr]">
                  <div className="space-y-2">
                    <div><span className="text-ink-400">Threshold:</span> {f.threshold ?? "—"}</div>
                    <div><span className="text-ink-400">Why:</span> {rec.why}</div>
                    <ol className="list-decimal space-y-1 ps-5">{rec.actions.map((a) => <li key={a}>{a}</li>)}</ol>
                    <div><span className="text-ink-400">Evidence required:</span> {rec.evidence}</div>
                    <div><span className="text-ink-400">Retest:</span> {rec.retest}</div>
                    <Link href={`/app/assessments/${f.assessment_id}`} className="text-xs text-brand-300">Source assessment →</Link>
                  </div>
                  {canEdit ? (
                    <form action={updateFinding} className="space-y-2">
                      <input type="hidden" name="id" value={f.id} />
                      <select name="status" defaultValue={f.status} className="input">{["open", "in_progress", "resolved", "accepted_risk"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
                      <div className="grid grid-cols-2 gap-2"><input name="assignee" defaultValue={f.assignee ?? ""} placeholder="Owner" className="input" /><input type="date" name="due_date" defaultValue={f.due_date ?? ""} className="input" /></div>
                      <textarea name="remediation_notes" defaultValue={f.remediation_notes ?? ""} rows={3} placeholder="Remediation notes / risk acceptance rationale" className="input" />
                      <SubmitButton className="btn-secondary w-full">Update action</SubmitButton>
                      <p className="text-[11px] text-ink-500">Marking resolved does not change the score — re-run the assessment to verify the fix.</p>
                    </form>
                  ) : <div className="text-xs text-ink-400">{f.remediation_notes}</div>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}

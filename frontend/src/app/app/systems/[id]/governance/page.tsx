import Link from "next/link";
import { ShieldCheck, Undo2 } from "lucide-react";
import { loadSystem } from "@/lib/systems";
import { CONTROL_DOMAINS, answerScore, controlsFor, type GovResponse } from "@/lib/engine/governance";
import { saveGovernance, verifyControl } from "@/app/app/actions";
import { SubmitButton } from "@/components/app/SubmitButton";

export default async function Governance({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { supabase, system, canEdit, role, user } = await loadSystem(id);
  const [{ data: responses }, { data: evidence }] = await Promise.all([
    supabase.from("governance_responses").select("*").eq("system_id", id),
    supabase.from("evidence_records").select("id, title").eq("org_id", system.org_id).order("created_at", { ascending: false }).limit(200),
  ]);
  const by = new Map((responses ?? []).map((r) => [r.control_key, r]));
  const controls = controlsFor(system.system_type);
  const answered = controls.filter((c) => by.has(c.key));
  const scores = answered.map((c) => answerScore(by.get(c.key) as GovResponse)).filter((x): x is number => x !== null);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const verified = (responses ?? []).filter((r) => r.verified_at).length;
  const canVerify = role === "auditor" || role === "admin" || role === "owner";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Answered", `${answered.length}/${controls.length}`], ["Governance score", avg ?? "—"], ["Evidence-linked", (responses ?? []).filter((r) => r.evidence_id).length], ["Auditor-verified", verified]].map(([k, v]) => (
          <div key={k as string} className="card p-4"><div className="text-xs uppercase tracking-wider text-ink-400">{k}</div><div className="h-display mt-1 text-2xl font-bold">{v}</div></div>
        ))}
      </div>
      {saved !== undefined && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{saved} control(s) updated. Changed answers lose prior auditor verification.</div>}
      <p className="text-sm text-ink-400">Scoring is evidence-weighted: self-declared YES = 80, evidence-linked = 92, auditor-verified = 100; PARTIAL earns half. Upload evidence in the <Link href="/app/evidence" className="text-brand-300">Evidence Vault</Link> first, then link it here.</p>

      <form action={saveGovernance} className="space-y-5">
        <input type="hidden" name="system_id" value={id} />
        {CONTROL_DOMAINS.map((d) => {
          const list = controls.filter((c) => c.domain === d);
          if (!list.length) return null;
          return (
            <section key={d} className="card overflow-hidden">
              <h2 className="border-b border-fg/[0.06] px-5 py-3 font-semibold">{d}</h2>
              <div className="divide-y divide-fg/[0.04]">
                {list.map((c) => {
                  const r = by.get(c.key);
                  return (
                    <div key={c.key} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.4fr_1fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-brand-300">{c.key}</span><span className="font-medium">{c.title}</span>{c.gate && <span className="chip border-red-500/30 bg-red-500/10 text-red-300">gate</span>}
                          {r?.verified_at && <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><ShieldCheck size={11} /> verified</span>}</div>
                        <p className="mt-1 text-sm text-ink-300">{c.question}</p>
                        <p className="mt-1 text-xs text-ink-500">Evidence: {c.guidance} · {Object.entries(c.refs).map(([k, v]) => `${k === "iso42001" ? "ISO 42001" : k === "nist" ? "NIST" : k === "euAiAct" ? "AI Act" : k === "gdpr" ? "GDPR" : ""} ${v}`.trim()).join(" · ")}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(["yes", "partial", "no", "na"] as const).map((a) => (
                            <label key={a} className="cursor-pointer rounded-lg border border-fg/10 px-3 py-1.5 text-xs font-semibold uppercase text-ink-300 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-500/20 has-[:checked]:text-fg">
                              <input type="radio" name={`a_${c.key}`} value={a} defaultChecked={r?.answer === a} disabled={!canEdit} className="sr-only" />{a === "na" ? "N/A" : a}
                            </label>
                          ))}
                        </div>
                        <select name={`e_${c.key}`} defaultValue={r?.evidence_id ?? ""} disabled={!canEdit} className="input py-1.5 text-xs">
                          <option value="">No evidence linked</option>
                          {(evidence ?? []).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                        </select>
                        <input name={`n_${c.key}`} defaultValue={r?.notes ?? ""} disabled={!canEdit} placeholder="Notes" className="input py-1.5 text-xs" />
                        {r && canVerify && r.updated_by !== user.id && (
                          <div className="flex justify-end">
                            <button formAction={verifyControl} name="verify" value={`${r.id}:${r.verified_at ? 1 : 0}`} className="btn-ghost px-2 py-1 text-xs" formNoValidate>
                              {r.verified_at ? <><Undo2 size={12} /> Remove verification</> : <><ShieldCheck size={12} /> Verify as auditor</>}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {canEdit && <div className="sticky bottom-4 flex justify-end"><SubmitButton className="btn-primary shadow-2xl">Save governance answers</SubmitButton></div>}
      </form>
    </div>
  );
}

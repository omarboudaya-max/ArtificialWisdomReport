import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { loadSystem } from "@/lib/systems";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Radar } from "@/components/ui/Radar";
import { TierBadge } from "@/components/ui/Badges";
import { scoreColor } from "@/lib/engine/scoring";
import { controlsFor } from "@/lib/engine/governance";
import { JURISDICTIONS } from "@/lib/engine/compliance";
import { toggleMonitoring } from "@/app/app/actions";

export default async function SystemOverview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const { supabase, system, canEdit } = await loadSystem(id);
  const [{ data: assessments }, { count: govCount }, { data: evals }, { count: openFindings }] = await Promise.all([
    supabase.from("assessments").select("id, aw_gti, rating, coverage, dimension_scores, credential_status, created_at, duration_ms, gates").eq("system_id", id).order("created_at", { ascending: false }).limit(25),
    supabase.from("governance_responses").select("*", { count: "exact", head: true }).eq("system_id", id),
    supabase.from("evaluations").select("kind").eq("system_id", id),
    supabase.from("findings").select("*", { count: "exact", head: true }).eq("system_id", id).in("status", ["open", "in_progress"]),
  ]);
  const latest = assessments?.[0];
  const prev = assessments?.[1];
  const totalControls = controlsFor(system.system_type).length;
  const steps = [
    { done: true, label: "Register system profile", href: `/app/systems/${id}/edit` },
    { done: !!system.risk_tier, label: "Classify EU AI Act risk tier", href: `/app/systems/${id}/classification` },
    { done: (govCount ?? 0) >= totalControls * 0.6, label: `Answer governance controls (${govCount ?? 0}/${totalControls})`, href: `/app/systems/${id}/governance` },
    { done: !!evals?.length || system.system_type === "llm_app" || system.system_type === "website", label: "Upload model or agent evaluation data (optional)", href: `/app/systems/${id}/evaluations` },
    { done: !!latest, label: "Run the 30-second assessment", href: `/app/assess?system=${id}` },
  ];
  const juris = JURISDICTIONS.filter((j) => system.jurisdictions?.includes(j.code)).map((j) => j.label);

  return (
    <div className="space-y-6">
      {created && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">System registered. Complete the readiness steps below to maximise assessment coverage.</div>}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
        <div className="card flex flex-col items-center justify-center gap-3 p-6">
          <ScoreRing score={latest?.aw_gti != null ? Number(latest.aw_gti) : null} size={150} sub="AW-GTI" />
          {latest ? (
            <>
              <div className="text-center text-sm font-semibold">{latest.rating}</div>
              <TierBadge tier={latest.credential_status} />
              {prev?.aw_gti != null && latest.aw_gti != null && (
                <div className={`text-xs font-semibold ${Number(latest.aw_gti) >= Number(prev.aw_gti) ? "text-emerald-300" : "text-red-300"}`}>
                  {Number(latest.aw_gti) >= Number(prev.aw_gti) ? "▲" : "▼"} {Math.abs(Number(latest.aw_gti) - Number(prev.aw_gti)).toFixed(1)} vs previous
                </div>
              )}
              <Link href={`/app/assessments/${latest.id}`} className="btn-secondary mt-1 text-xs">Open full report <ArrowRight size={13} className="rtl:rotate-180" /></Link>
            </>
          ) : <p className="text-center text-sm text-ink-400">Not assessed yet</p>}
        </div>
        <div className="card flex items-center justify-center p-4">
          <Radar values={(latest?.dimension_scores ?? {}) as Record<string, number | null>} compare={(prev?.dimension_scores ?? undefined) as Record<string, number | null> | undefined} size={280} />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Assessment readiness</h2>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.03]">
                  {s.done ? <CheckCircle2 size={17} className="text-emerald-400" /> : <Circle size={17} className="text-ink-500" />}
                  <span className={s.done ? "text-ink-300" : "text-ink-100"}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-ink-400">{openFindings ?? 0} open corrective actions</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="card p-5 text-sm">
          <h2 className="mb-3 font-semibold">Profile</h2>
          <dl className="space-y-2">
            {[
              ["Purpose", system.description || system.use_case],
              ["Public URL", system.url],
              ["Provider / model", [system.provider, system.model_name].filter(Boolean).join(" · ")],
              ["Sector", system.sector],
              ["Jurisdictions", juris.join(", ")],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-2"><dt className="text-ink-400">{k}</dt><dd className="break-words text-ink-200">{v || "—"}</dd></div>
            ))}
          </dl>
          {canEdit && (
            <form action={toggleMonitoring} className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="enabled" value={String(!system.monitoring_enabled)} />
              <div><div className="flex items-center gap-1.5 font-semibold"><Activity size={14} /> Continuous monitoring</div><div className="text-xs text-ink-400">Daily re-scan, drift, certificate and credential expiry alerts{!system.url && " (requires a public URL)"}</div></div>
              <button className={system.monitoring_enabled ? "btn-secondary text-xs" : "btn-primary text-xs"} disabled={!system.url}>{system.monitoring_enabled ? "Disable" : "Enable"}</button>
            </form>
          )}
        </div>
        <div className="card overflow-hidden">
          <h2 className="px-5 py-4 font-semibold">Assessment history</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-white/[0.06] text-left text-xs uppercase tracking-wider text-ink-400">
                <tr><th className="px-5 py-2.5">Date</th><th className="px-3 py-2.5">AW-GTI</th><th className="px-3 py-2.5">Coverage</th><th className="px-3 py-2.5">Duration</th><th className="px-3 py-2.5">Outcome</th></tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(assessments ?? []).map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5"><Link href={`/app/assessments/${a.id}`} className="hover:text-brand-300">{new Date(a.created_at).toLocaleString()}</Link></td>
                    <td className="px-3 py-2.5 font-bold tabular-nums" style={{ color: scoreColor(a.aw_gti != null ? Number(a.aw_gti) : null) }}>{a.aw_gti ?? "—"}</td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-300">{a.coverage}%</td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-300">{a.duration_ms ? `${(a.duration_ms / 1000).toFixed(1)}s` : "—"}</td>
                    <td className="px-3 py-2.5"><TierBadge tier={a.credential_status} /></td>
                  </tr>
                ))}
                {!assessments?.length && <tr><td colSpan={5} className="px-5 py-6 text-center text-ink-400">No assessments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

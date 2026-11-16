import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, Boxes, ListChecks, PlayCircle, Plus } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { PageHeader, Empty, SeverityBadge, TierBadge } from "@/components/ui/Badges";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Radar } from "@/components/ui/Radar";
import { scoreColor } from "@/lib/engine/scoring";
import { TIER_LABEL, type RiskTier } from "@/lib/engine/eu-ai-act";
import type { FrameworkResult } from "@/lib/engine/compliance";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const [{ supabase, org, canEdit }, { t, date }] = await Promise.all([requireOrg(), getT()]);
  const [systemsQ, assessQ, findingsQ, eventsQ, credsQ] = await Promise.all([
    supabase.from("ai_systems").select("id, name, system_type, risk_tier, monitoring_enabled").eq("org_id", org.id).order("created_at"),
    supabase.from("assessments").select("id, system_id, aw_gti, rating, coverage, dimension_scores, gates, compliance, credential_status, created_at, duration_ms").eq("org_id", org.id).order("created_at", { ascending: false }).limit(300),
    supabase.from("findings").select("severity, status").eq("org_id", org.id).in("status", ["open", "in_progress"]),
    supabase.from("monitoring_events").select("id, severity, message, created_at, system_id").eq("org_id", org.id).order("created_at", { ascending: false }).limit(6),
    supabase.from("credentials").select("tier, status, expires_at").eq("org_id", org.id).eq("status", "active"),
  ]);
  const systems = systemsQ.data ?? [];
  if (!systems.length)
    return (
      <>
        <PageHeader eyebrow={org.name} title={t("ov.welcome")} subtitle={t("ov.welcomeSub")} />
        <Empty icon={<Boxes size={30} />} title={t("ov.empty")}>
          {t("ov.emptySub")}
          {canEdit && <div className="mt-5"><Link href="/app/systems/new" className="btn-primary"><Plus size={16} /> {t("ov.register")}</Link></div>}
        </Empty>
      </>
    );

  const latest = new Map<string, NonNullable<typeof assessQ.data>[number]>();
  for (const a of assessQ.data ?? []) if (!latest.has(a.system_id)) latest.set(a.system_id, a);
  const scored = [...latest.values()].filter((a) => a.aw_gti != null);
  const portfolio = scored.length ? Math.round((scored.reduce((s, a) => s + Number(a.aw_gti), 0) / scored.length) * 10) / 10 : null;
  const dimAvg: Record<string, number | null> = {};
  for (const a of scored) for (const [k, v] of Object.entries((a.dimension_scores ?? {}) as Record<string, number | null>)) {
    if (v == null) continue;
    dimAvg[k] = (dimAvg[k] ?? 0) + v / scored.filter((x) => (x.dimension_scores as Record<string, number | null>)?.[k] != null).length;
  }
  const gateFails = scored.filter((a) => ((a.gates ?? []) as { passed: boolean }[]).some((g) => !g.passed)).length;
  const open = findingsQ.data ?? [];
  const sev = (s: string) => open.filter((f) => f.severity === s).length;
  const creds = credsQ.data ?? [];
  const euGaps = scored.reduce((n, a) => n + (((a.compliance ?? []) as FrameworkResult[]).find((f) => f.key === "eu_ai_act")?.counts.gap ?? 0), 0);
  const trend = (assessQ.data ?? []).slice(0, 20).reverse();

  return (
    <>
      <PageHeader eyebrow={org.name} title={t("ov.title")} subtitle={t("ov.subtitle")}
        actions={canEdit ? <Link href="/app/assess" className="btn-primary"><PlayCircle size={16} /> {t("act.runAssessment")}</Link> : undefined} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <div className="card flex flex-col items-center justify-center gap-3 p-6 sm:flex-row sm:justify-around">
          <ScoreRing score={portfolio} size={150} sub={t("ov.portfolio")} />
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Boxes size={15} className="text-ink-400" /> {systems.length} {t("ov.systems")} · {scored.length} {t("ov.assessed")}</div>
            <div className="flex items-center gap-2"><AlertTriangle size={15} className={gateFails ? "text-red-400" : "text-ink-400"} /> {gateFails} {t("ov.gateFails")}</div>
            <div className="flex items-center gap-2"><BadgeCheck size={15} className="text-emerald-400" /> {creds.filter((c) => c.tier !== "automated_assessment").length} {t("ov.activeCreds")}</div>
            <div className="flex items-center gap-2"><Activity size={15} className="text-ink-400" /> {systems.filter((s) => s.monitoring_enabled).length} {t("ov.monitored")}</div>
          </div>
        </div>
        <div className="card flex items-center justify-center p-4"><Radar values={dimAvg} size={280} /></div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{t("ov.openActions")}</h2><Link href="/app/findings" className="text-xs text-brand-300 hover:text-fg">{t("common.viewAll")}</Link></div>
          <div className="grid grid-cols-2 gap-3">
            {(["critical", "high", "medium", "low"] as const).map((s) => (
              <div key={s} className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-3">
                <SeverityBadge severity={s} />
                <div className="h-display mt-2 text-2xl font-bold tabular-nums">{sev(s)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-3 text-sm">
            <span className="font-semibold">{euGaps}</span> <span className="text-ink-300">{t("ov.euGaps")}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4"><h2 className="font-semibold">{t("ov.inventory")}</h2><Link href="/app/systems" className="text-xs text-brand-300 hover:text-fg">{t("common.manage")}</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-fg/[0.06] text-start text-xs uppercase tracking-wider text-ink-400">
                <tr><th className="px-5 py-2.5 font-semibold">{t("col.system")}</th><th className="px-3 py-2.5 font-semibold">{t("col.riskTier")}</th><th className="px-3 py-2.5 font-semibold">AW-GTI</th><th className="px-3 py-2.5 font-semibold">{t("col.status")}</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-fg/[0.04]">
                {systems.map((s) => {
                  const a = latest.get(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-fg/[0.02]">
                      <td className="px-5 py-3"><Link href={`/app/systems/${s.id}`} className="font-medium hover:text-brand-300">{s.name}</Link><div className="text-xs text-ink-400">{s.system_type.replace("_", " ")}</div></td>
                      <td className="px-3 py-3 text-xs text-ink-300">{s.risk_tier ? TIER_LABEL[s.risk_tier as RiskTier] : <Link href={`/app/systems/${s.id}/classification`} className="text-brand-300">{t("act.classify")}</Link>}</td>
                      <td className="px-3 py-3 font-bold tabular-nums" style={{ color: scoreColor(a?.aw_gti != null ? Number(a.aw_gti) : null) }}>{a?.aw_gti ?? "—"}</td>
                      <td className="px-3 py-3">{a ? <TierBadge tier={a.credential_status} /> : <span className="text-xs text-ink-500">{t("common.notAssessed")}</span>}</td>
                      <td className="px-3 py-3 text-end">{a && <Link href={`/app/assessments/${a.id}`} className="text-ink-400 hover:text-fg"><ArrowRight size={15} className="rtl:rotate-180" /></Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">{t("ov.trend")}</h2>
            {trend.length > 1 ? (
              <svg viewBox="0 0 300 90" className="h-24 w-full">
                <polyline fill="none" stroke="#818cf8" strokeWidth="2" points={trend.map((a, i) => `${(i / (trend.length - 1)) * 300},${90 - (Number(a.aw_gti ?? 0) / 100) * 85}`).join(" ")} />
                {trend.map((a, i) => <circle key={a.id} cx={(i / (trend.length - 1)) * 300} cy={90 - (Number(a.aw_gti ?? 0) / 100) * 85} r="2.5" fill={scoreColor(Number(a.aw_gti))} />)}
              </svg>
            ) : <p className="text-sm text-ink-400">{t("ov.moreRuns")}</p>}
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{t("ov.alerts")}</h2><Link href="/app/monitoring" className="text-xs text-brand-300 hover:text-fg">{t("app.monitoring")}</Link></div>
            <ul className="space-y-3">
              {(eventsQ.data ?? []).map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-sm"><SeverityBadge severity={e.severity} /><span className="flex-1 text-ink-200">{e.message}<span className="block text-xs text-ink-500">{date(e.created_at, true)}</span></span></li>
              ))}
              {!eventsQ.data?.length && <li className="text-sm text-ink-400">{t("ov.noEvents")}</li>}
            </ul>
          </div>
          <div className="card p-5 text-sm">
            <ListChecks size={16} className="mb-2 text-brand-300" />
            <p className="text-ink-300">Fastest score improvements are listed with projected uplift on each assessment report.</p>
          </div>
        </div>
      </div>
    </>
  );
}

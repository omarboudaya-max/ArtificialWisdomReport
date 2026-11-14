import Link from "next/link";
import { Boxes, Plus, Activity } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { Empty, PageHeader, TierBadge } from "@/components/ui/Badges";
import { scoreColor } from "@/lib/engine/scoring";
import { TIER_LABEL, type RiskTier } from "@/lib/engine/eu-ai-act";

export const metadata = { title: "AI Systems" };

export default async function Systems() {
  const { supabase, org, canEdit } = await requireOrg();
  const [{ data: systems }, { data: assessments }] = await Promise.all([
    supabase.from("ai_systems").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("assessments").select("system_id, aw_gti, rating, credential_status, created_at").eq("org_id", org.id).order("created_at", { ascending: false }).limit(500),
  ]);
  const latest = new Map<string, NonNullable<typeof assessments>[number]>();
  for (const a of assessments ?? []) if (!latest.has(a.system_id)) latest.set(a.system_id, a);
  return (
    <>
      <PageHeader eyebrow="Module 01" title="AI system inventory" subtitle="Every AI system with its profile, risk tier and latest assurance status."
        actions={canEdit ? <Link href="/app/systems/new" className="btn-primary"><Plus size={16} /> Register system</Link> : undefined} />
      {!systems?.length ? (
        <Empty icon={<Boxes size={36} />} title="Your inventory is empty">Register chatbots, agents, RAG assistants, ML models and AI-powered websites.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {systems.map((s) => {
            const a = latest.get(s.id);
            return (
              <Link key={s.id} href={`/app/systems/${s.id}`} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{s.name}</h3>
                    <p className="text-xs text-ink-400">{s.system_type.replace("_", " ")} · {s.provider || "provider n/a"} {s.model_name ? `· ${s.model_name}` : ""}</p>
                  </div>
                  <div className="h-display text-2xl font-bold tabular-nums" style={{ color: scoreColor(a?.aw_gti != null ? Number(a.aw_gti) : null) }}>{a?.aw_gti != null ? Math.round(Number(a.aw_gti)) : "—"}</div>
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-sm text-ink-300">{s.description || s.use_case || "No description"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {a ? <TierBadge tier={a.credential_status} /> : <span className="chip border-white/10 text-ink-400">Not assessed</span>}
                  {s.risk_tier && <span className="chip border-white/10 bg-white/[0.03] text-ink-300">{TIER_LABEL[s.risk_tier as RiskTier]}</span>}
                  {s.monitoring_enabled && <span className="chip border-cyan-500/30 bg-cyan-500/10 text-cyan-300"><Activity size={11} /> Monitored</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

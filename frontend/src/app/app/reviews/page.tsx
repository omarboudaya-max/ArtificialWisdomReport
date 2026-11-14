import Link from "next/link";
import { requireOrg } from "@/lib/session";
import { Empty, PageHeader, TierBadge } from "@/components/ui/Badges";
import { scoreColor } from "@/lib/engine/scoring";

export const metadata = { title: "Auditor reviews" };

export default async function Reviews() {
  const { supabase, org, role, user } = await requireOrg();
  const [{ data: assessments }, { data: reviews }] = await Promise.all([
    supabase.from("assessments").select("id, system_id, aw_gti, rating, coverage, gates, credential_status, created_at, created_by, ai_systems(name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("human_reviews").select("assessment_id, decision, created_at, reviewer_id").eq("org_id", org.id),
  ]);
  const reviewed = new Map<string, { decision: string }[]>();
  (reviews ?? []).forEach((r) => reviewed.set(r.assessment_id, [...(reviewed.get(r.assessment_id) ?? []), r]));
  const latestPerSystem = new Set<string>();
  const queue = (assessments ?? []).filter((a) => { if (latestPerSystem.has(a.system_id)) return false; latestPerSystem.add(a.system_id); return true; });
  const canReview = ["auditor", "admin", "owner"].includes(role);
  return (
    <>
      <PageHeader eyebrow="Independent auditor portal" title="Review queue" subtitle="Separation of duties: assessments are initiated by system owners and reviewed by auditors who declare no conflict of interest. Reviews never alter automated results — they add an independent conclusion." />
      {!canReview && <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-300">You are a <b>{role}</b>. Invite an auditor in Settings to enable independent review.</div>}
      {!queue.length ? <Empty title="Nothing to review">Latest assessments of each system appear here.</Empty> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">System</th><th className="px-3 py-3">AW-GTI</th><th className="px-3 py-3">Gates</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Reviews</th><th /></tr></thead>
            <tbody className="divide-y divide-white/[0.04]">
              {queue.map((a) => {
                const gatesFailed = ((a.gates ?? []) as { passed: boolean }[]).filter((g) => !g.passed).length;
                const rv = reviewed.get(a.id) ?? [];
                return (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3"><div className="font-medium">{(a.ai_systems as unknown as { name: string })?.name}</div><div className="text-xs text-ink-400">{new Date(a.created_at).toLocaleString()} · coverage {a.coverage}%</div></td>
                    <td className="px-3 py-3 font-bold" style={{ color: scoreColor(a.aw_gti != null ? Number(a.aw_gti) : null) }}>{a.aw_gti ?? "—"}</td>
                    <td className={`px-3 py-3 text-xs ${gatesFailed ? "text-red-300" : "text-emerald-300"}`}>{gatesFailed ? `${gatesFailed} failed` : "clean"}</td>
                    <td className="px-3 py-3"><TierBadge tier={a.credential_status} /></td>
                    <td className="px-3 py-3 text-xs text-ink-300">{rv.length ? rv.map((r) => r.decision).join(", ") : "pending"}</td>
                    <td className="px-3 py-3 text-end"><Link href={`/app/assessments/${a.id}#review`} className="btn-secondary py-1.5 text-xs">{canReview && a.created_by !== user.id ? "Review" : "Open"}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

import { ShieldCheck, ShieldX } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { PageHeader } from "@/components/ui/Badges";

export const metadata = { title: "Audit trail" };

export default async function AuditLog() {
  const { supabase, org } = await requireOrg();
  const [{ data: logs }, { data: broken, error }] = await Promise.all([
    supabase.from("audit_logs").select("*").eq("org_id", org.id).order("id", { ascending: false }).limit(200),
    supabase.rpc("verify_audit_chain", { p_org: org.id }),
  ]);
  const { data: people } = await supabase.from("profiles").select("id, full_name, email");
  const who = (id: string | null) => (id ? people?.find((p) => p.id === id)?.full_name ?? id.slice(0, 8) : "system");
  const intact = !error && (broken ?? []).length === 0;
  return (
    <>
      <PageHeader eyebrow="Tamper-evident" title="Audit trail" subtitle="Every change to systems, assessments, credentials, controls, findings, reviews and evidence is chained with SHA-256: each entry commits to the previous one, so any alteration breaks the chain." />
      <div className={`card mb-5 flex items-center gap-3 p-4 ${intact ? "border-emerald-500/30" : "border-red-500/40"}`}>
        {intact ? <ShieldCheck className="text-emerald-400" /> : <ShieldX className="text-red-400" />}
        <div className="text-sm">{intact ? <><b>Chain verified.</b> All entries recomputed and matched just now.</> : <><b className="text-red-300">Integrity violation detected.</b> {error?.message ?? (broken ?? []).map((b: { id: number; problem: string }) => `#${b.id}: ${b.problem}`).join("; ")}</>}</div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">#</th><th className="px-3 py-3">When</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Event</th><th className="px-3 py-3">Details</th><th className="px-3 py-3">Hash</th></tr></thead>
            <tbody className="divide-y divide-white/[0.04]">
              {(logs ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-2.5 font-mono text-xs text-ink-500">{l.id}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-ink-300">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs">{who(l.actor_id)}</td>
                  <td className="px-3 py-2.5"><span className="font-mono text-xs text-brand-300">{l.entity}</span> <span className="text-xs text-ink-400">{l.action}</span></td>
                  <td className="max-w-md truncate px-3 py-2.5 font-mono text-[11px] text-ink-400">{JSON.stringify(l.data)}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-ink-500">{l.hash.slice(0, 12)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

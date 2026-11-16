import { Download, ExternalLink } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Badges";
import { EvidenceUpload } from "@/components/app/EvidenceUpload";
import { VerifyIntegrity } from "@/components/app/VerifyIntegrity";

export const metadata = { title: "Evidence vault" };

export default async function Evidence() {
  const [{ supabase, org }, { t }] = await Promise.all([requireOrg(), getT()]);
  const [{ data: rows }, { data: systems }, { data: links }] = await Promise.all([
    supabase.from("evidence_records").select("*, ai_systems(name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(300),
    supabase.from("ai_systems").select("id, name").eq("org_id", org.id).order("name"),
    supabase.from("governance_responses").select("evidence_id, control_key").eq("org_id", org.id).not("evidence_id", "is", null),
  ]);
  const linked = new Map<string, string[]>();
  (links ?? []).forEach((l) => linked.set(l.evidence_id!, [...(linked.get(l.evidence_id!) ?? []), l.control_key]));
  return (
    <>
      <PageHeader eyebrow="Evidence & audit trail" title={t("pg.evidence")} subtitle="Policies, test results, approvals, model documentation and corrective-action proof — fingerprinted and linked to governance controls." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start"><EvidenceUpload orgId={org.id} systems={systems ?? []} /></div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-fg/[0.06] text-start text-xs uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">Evidence</th><th className="px-3 py-3">Scope</th><th className="px-3 py-3">SHA-256</th><th className="px-3 py-3">Controls</th><th className="px-3 py-3" /></tr></thead>
              <tbody className="divide-y divide-fg/[0.04]">
                {(rows ?? []).map((r) => (
                  <tr key={r.id} className="hover:bg-fg/[0.02]">
                    <td className="px-5 py-3"><div className="font-medium">{r.title}</div><div className="text-xs text-ink-400">{r.kind} · {new Date(r.created_at).toLocaleDateString()} {r.size_bytes ? `· ${(r.size_bytes / 1024).toFixed(0)} KB` : ""}</div></td>
                    <td className="px-3 py-3 text-xs text-ink-300">{(r.ai_systems as unknown as { name: string } | null)?.name ?? "Organization"}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-ink-400">{r.sha256?.slice(0, 16)}…</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-brand-300">{(linked.get(r.id) ?? []).join(", ") || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-end">
                      {r.storage_path && <VerifyIntegrity id={r.id} />}
                      <a href={`/api/evidence/${r.id}`} target="_blank" rel="noreferrer" className="btn-ghost px-2 py-1 text-xs">{r.storage_path ? <Download size={12} /> : <ExternalLink size={12} />} Open</a>
                    </td>
                  </tr>
                ))}
                {!rows?.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-400">The vault is empty. Upload your first policy or test report.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

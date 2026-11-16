import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { Empty, PageHeader } from "@/components/ui/Badges";
import { FRAMEWORKS, type FrameworkResult } from "@/lib/engine/compliance";
import { scoreColor } from "@/lib/engine/scoring";

export const metadata = { title: "Compliance center" };
const ST: Record<string, string> = { met: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", partial: "bg-amber-500/15 text-amber-300 border-amber-500/30", gap: "bg-red-500/15 text-red-300 border-red-500/30", not_assessed: "bg-fg/[0.03] text-ink-400 border-fg/10" };

export default async function Compliance({ searchParams }: { searchParams: Promise<{ system?: string }> }) {
  const sp = await searchParams;
  const [{ supabase, org }, { t }] = await Promise.all([requireOrg(), getT()]);
  const { data: systems } = await supabase.from("ai_systems").select("id, name").eq("org_id", org.id).order("name");
  const systemId = sp.system ?? systems?.[0]?.id;
  const { data: a } = systemId ? await supabase.from("assessments").select("id, compliance, created_at").eq("system_id", systemId).order("created_at", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const results = ((a?.compliance ?? []) as FrameworkResult[]);
  return (
    <>
      <PageHeader eyebrow="Module 06 · Global conformity mapping" title={t("pg.compliance")} subtitle="Requirement-level status for each instrument, derived from the latest assessment evidence. Binding law, voluntary standards and guidance are kept distinct." />
      <div className="mb-6 flex flex-wrap gap-2">
        {(systems ?? []).map((s) => <Link key={s.id} href={`/app/compliance?system=${s.id}`} className={`rounded-lg border px-3 py-1.5 text-sm ${s.id === systemId ? "border-brand-400 bg-brand-500/20 text-fg" : "border-fg/10 text-ink-300"}`}>{s.name}</Link>)}
      </div>
      {!a ? <Empty title="No assessment for this system yet">Run an assessment to generate a compliance gap analysis.</Empty> : (
        <div className="space-y-4">
          <p className="text-xs text-ink-400">Based on assessment of {new Date(a.created_at).toLocaleString()} · <Link href={`/app/assessments/${a.id}`} className="text-brand-300">open report</Link></p>
          {[...results].sort((x, y) => Number(y.applicable) - Number(x.applicable)).map((r) => {
            const f = FRAMEWORKS.find((x) => x.key === r.key)!;
            return (
              <section key={r.key} id={r.key} className={`card p-5 ${r.applicable ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{f.name}</h2><span className="chip border-fg/10 text-ink-300 normal-case tracking-normal">{f.status}</span>{!r.applicable && <span className="chip border-fg/10 text-ink-500 normal-case tracking-normal">outside declared scope</span>}</div>
                    <div className="mt-1 text-xs text-ink-400">{f.jurisdiction} · {f.body} · {f.effective}</div>
                    {f.note && <div className="mt-1 text-xs text-amber-200/80">{f.note}</div>}
                  </div>
                  <div className="flex items-center gap-3"><div className="h-display text-3xl font-bold" style={{ color: scoreColor(r.score) }}>{r.score ?? "—"}</div><a href={f.url} target="_blank" rel="noreferrer" className="btn-ghost px-2"><ExternalLink size={15} /></a></div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-fg/[0.04]">
                      {r.requirements.map((q) => (
                        <tr key={q.id}>
                          <td className="w-32 py-2 font-mono text-xs text-brand-300">{q.id}</td>
                          <td className="py-2">{q.title}<div className="text-[11px] text-ink-500">{q.evidence.map((e) => `${e.key}: ${e.status}`).join(" · ") || "no evidence in scope"}</div></td>
                          <td className="w-28 py-2 text-end"><span className={`chip ${ST[q.status]}`}>{q.status.replace("_", " ")}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

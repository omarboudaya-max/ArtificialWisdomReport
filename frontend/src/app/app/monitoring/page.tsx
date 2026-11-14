import Link from "next/link";
import { Check } from "lucide-react";
import { requireOrg } from "@/lib/session";
import { PageHeader, SeverityBadge } from "@/components/ui/Badges";
import { RunMonitorButton } from "@/components/app/RunMonitorButton";
import { acknowledgeEvent } from "../actions";

export const metadata = { title: "Continuous monitoring" };

export default async function Monitoring() {
  const { supabase, org } = await requireOrg();
  const [{ data: systems }, { data: events }] = await Promise.all([
    supabase.from("ai_systems").select("id, name, url, monitoring_enabled").eq("org_id", org.id).order("name"),
    supabase.from("monitoring_events").select("*, ai_systems(name)").eq("org_id", org.id).order("created_at", { ascending: false }).limit(150),
  ]);
  const lastScan = new Map<string, { created_at: string; data: { score?: number } }>();
  for (const e of events ?? []) if (e.kind === "scan" && e.system_id && !lastScan.has(e.system_id)) lastScan.set(e.system_id, e as never);
  return (
    <>
      <PageHeader eyebrow="Module 07 · Continuous assurance" title="Monitoring & alerts" subtitle="Daily automated re-scans detect score drift, new failing checks, certificate and credential expiry. Critical events can be pushed to Slack / Teams via webhook (Settings)." />
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(systems ?? []).map((s) => {
          const ls = lastScan.get(s.id);
          return (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><Link href={`/app/systems/${s.id}`} className="truncate font-medium hover:text-brand-300">{s.name}</Link><div className="truncate text-xs text-ink-400">{s.url ?? "no public URL"}</div></div>
                <span className={`chip ${s.monitoring_enabled ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-white/10 text-ink-500"}`}>{s.monitoring_enabled ? "daily" : "off"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                <span>{ls ? `Last scan ${new Date(ls.created_at).toLocaleString()} · ${ls.data?.score ?? "—"}` : "Never scanned"}</span>
                <RunMonitorButton systemId={s.id} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="card overflow-hidden">
        <h2 className="border-b border-white/[0.06] px-5 py-3 font-semibold">Event stream</h2>
        <ul className="divide-y divide-white/[0.04]">
          {(events ?? []).map((e) => (
            <li key={e.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 text-sm ${e.acknowledged ? "opacity-50" : ""}`}>
              <SeverityBadge severity={e.severity} />
              <span className="font-mono text-[11px] text-ink-500">{e.kind}</span>
              <span className="min-w-0 flex-1">{e.message}<span className="block text-xs text-ink-500">{(e.ai_systems as unknown as { name: string } | null)?.name} · {new Date(e.created_at).toLocaleString()}</span></span>
              {!e.acknowledged && e.severity !== "info" && <form action={acknowledgeEvent}><input type="hidden" name="id" value={e.id} /><button className="btn-ghost px-2 py-1 text-xs"><Check size={12} /> Acknowledge</button></form>}
            </li>
          ))}
          {!events?.length && <li className="px-5 py-10 text-center text-sm text-ink-400">No events yet.</li>}
        </ul>
      </div>
    </>
  );
}

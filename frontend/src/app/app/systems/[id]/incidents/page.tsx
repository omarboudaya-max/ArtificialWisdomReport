import { loadSystem } from "@/lib/systems";
import { createIncident, updateIncident } from "@/app/app/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { SeverityBadge } from "@/components/ui/Badges";

export default async function Incidents({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await loadSystem(id);
  const { data: incidents } = await supabase.from("incident_reports").select("*").eq("system_id", id).order("occurred_at", { ascending: false });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <form action={createIncident} className="card h-fit space-y-4 p-5">
        <input type="hidden" name="system_id" value={id} />
        <h2 className="font-semibold">Log an AI incident</h2>
        <p className="text-xs text-ink-400">Structured along OECD AI incident reporting fields. Serious incidents may require notification under EU AI Act Art. 73, GDPR Art. 33 or NIS2 Art. 23.</p>
        <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" required className="input" placeholder="Assistant disclosed another customer's order" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="severity">Severity</label><select id="severity" name="severity" className="input">{["critical", "high", "medium", "low"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label" htmlFor="occurred_at">Occurred</label><input id="occurred_at" name="occurred_at" type="datetime-local" className="input" /></div>
          <div><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="input">{["Security / prompt injection", "Privacy / data leakage", "Harmful or toxic output", "Discrimination / bias", "Hallucination / misinformation", "Unauthorised agent action", "Availability / performance", "Other"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label" htmlFor="harm_type">Harm type</label><select id="harm_type" name="harm_type" className="input">{["None (near miss)", "Physical", "Psychological", "Economic / financial", "Reputational", "Fundamental rights", "Societal", "Environmental"].map((s) => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="label" htmlFor="description">Description, impact & containment</label><textarea id="description" name="description" rows={4} className="input" /></div>
        <SubmitButton className="btn-primary w-full">Record incident</SubmitButton>
      </form>
      <div className="space-y-3">
        {(incidents ?? []).map((i) => (
          <div key={i.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><div className="font-semibold">{i.title}</div><div className="text-xs text-ink-400">{new Date(i.occurred_at).toLocaleString()} · {i.category} · {i.harm_type}</div></div>
              <SeverityBadge severity={i.severity} />
            </div>
            {i.description && <p className="mt-3 whitespace-pre-wrap text-sm text-ink-300">{i.description}</p>}
            <form action={updateIncident} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={i.id} /><input type="hidden" name="system_id" value={id} />
              <select name="status" defaultValue={i.status} className="input w-auto py-1.5 text-xs">{["open", "investigating", "mitigated", "closed"].map((s) => <option key={s}>{s}</option>)}</select>
              <SubmitButton className="btn-secondary py-1.5 text-xs">Update</SubmitButton>
            </form>
          </div>
        ))}
        {!incidents?.length && <div className="card p-8 text-center text-sm text-ink-400">No incidents recorded for this system.</div>}
      </div>
    </div>
  );
}

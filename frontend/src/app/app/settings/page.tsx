import { requireOrg } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Badges";
import { addMember, removeMember, updateOrgSettings } from "../actions";
import { SubmitButton } from "@/components/app/SubmitButton";

export const metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; added?: string }> }) {
  const sp = await searchParams;
  const [{ supabase, org, isAdmin, user }, { t }] = await Promise.all([requireOrg(), getT()]);
  const [{ data: o }, { data: members }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", org.id).single(),
    supabase.from("memberships").select("user_id, role, created_at").eq("org_id", org.id),
  ]);
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", (members ?? []).map((m) => m.user_id));
  return (
    <>
      <PageHeader eyebrow={org.name} title={t("pg.settings")} subtitle="Workspace profile, role-based access and alert integrations." />
      {sp.error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{sp.error}</div>}
      {(sp.saved || sp.added) && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Saved.</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={updateOrgSettings} className="card space-y-4 p-6">
          <h2 className="font-semibold">Workspace</h2>
          <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" defaultValue={o?.name} className="input" disabled={!isAdmin} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="sector">Sector</label><input id="sector" name="sector" defaultValue={o?.sector ?? ""} className="input" disabled={!isAdmin} /></div>
            <div><label className="label" htmlFor="country">Country</label><input id="country" name="country" defaultValue={o?.country ?? ""} className="input" disabled={!isAdmin} /></div>
          </div>
          <div><label className="label" htmlFor="hook">Alert webhook (Slack / Teams / custom, https)</label><input id="hook" name="alert_webhook_url" defaultValue={o?.alert_webhook_url ?? ""} className="input" placeholder="https://hooks.slack.com/services/…" disabled={!isAdmin} />
            <p className="mt-1 text-xs text-ink-500">Receives critical gate failures, drift and expiry alerts as {"{ text }"} JSON.</p></div>
          {isAdmin && <SubmitButton>Save settings</SubmitButton>}
        </form>
        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Members & roles</h2>
          <ul className="mb-5 divide-y divide-fg/[0.05]">
            {(members ?? []).map((m) => {
              const p = profiles?.find((x) => x.id === m.user_id);
              return (
                <li key={m.user_id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0"><div className="truncate font-medium">{p?.full_name ?? "—"}{m.user_id === user.id && " (you)"}</div><div className="truncate text-xs text-ink-400">{p?.email}</div></div>
                  <span className="chip border-fg/10 text-ink-300">{m.role}</span>
                  {isAdmin && m.role !== "owner" && m.user_id !== user.id && <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><button className="btn-ghost px-2 py-1 text-xs text-red-300">Remove</button></form>}
                </li>
              );
            })}
          </ul>
          {isAdmin && (
            <form action={addMember} className="space-y-3 rounded-xl border border-fg/[0.06] p-4">
              <div className="text-sm font-semibold">Add member</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input name="email" type="email" required className="input" placeholder="colleague@company.com" />
                <select name="role" className="input sm:w-36"><option value="member">Member</option><option value="admin">Admin</option><option value="auditor">Auditor</option></select>
              </div>
              <SubmitButton className="btn-secondary w-full">Add to workspace</SubmitButton>
              <p className="text-xs text-ink-500">The person must have signed up first. Auditors have read-only access to systems, can verify governance controls and review assessments — but cannot initiate assessments (separation of duties).</p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

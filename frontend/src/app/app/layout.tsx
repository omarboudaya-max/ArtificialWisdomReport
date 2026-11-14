import { requireOrg } from "@/lib/session";
import { Sidebar } from "@/components/app/Sidebar";
import { isAdminConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, orgs, org, role } = await requireOrg();
  const { count } = await supabase.from("monitoring_events").select("*", { count: "exact", head: true }).eq("org_id", org.id).eq("acknowledged", false).in("severity", ["critical", "high"]);
  return (
    <div className="min-h-dvh">
      <Sidebar orgs={orgs} orgId={org.id} role={role} email={user.email ?? ""} alerts={count ?? 0} />
      <div className="lg:ps-64">
        {!isAdminConfigured() && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-2 text-center text-xs text-amber-200">
            SUPABASE_SERVICE_ROLE_KEY is not configured — assessments, evaluations, evidence uploads and credentials cannot be saved.
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

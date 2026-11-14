import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type Role = "owner" | "admin" | "member" | "auditor";
export interface OrgSummary { id: string; name: string; role: Role }

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/** Requires a signed-in user with at least one organization; resolves the active org from the aw_org cookie. */
export async function requireOrg() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const { data: rows } = await supabase
    .from("memberships")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at");
  const orgs: OrgSummary[] = (rows ?? [])
    .map((r) => {
      const o = r.organizations as unknown as { id: string; name: string } | null;
      return o ? { id: o.id, name: o.name, role: r.role as Role } : null;
    })
    .filter((x): x is OrgSummary => !!x);
  if (!orgs.length) redirect("/onboarding");
  const jar = await cookies();
  const wanted = jar.get("aw_org")?.value;
  const org = orgs.find((o) => o.id === wanted) ?? orgs[0];
  return { supabase, user, orgs, org, role: org.role, canEdit: org.role !== "auditor", isAdmin: org.role === "owner" || org.role === "admin" };
}

export async function requireMembership(orgId: string) {
  const { supabase, user } = await getSession();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase.from("memberships").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
  if (!data) throw new Error("Forbidden");
  return { supabase, user, role: data.role as Role };
}

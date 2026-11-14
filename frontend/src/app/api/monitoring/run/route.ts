import { isAdminConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { monitorSystem } from "@/lib/monitor";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!isAdminConfigured()) return Response.json({ error: "Supabase is not configured on this deployment" }, { status: 503 });
  const { supabase, user } = await getSession();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const { systemId } = await req.json().catch(() => ({}));
  const { data: s } = await supabase.from("ai_systems").select("id, org_id, name, url").eq("id", systemId).maybeSingle();
  if (!s) return Response.json({ error: "Not found" }, { status: 404 });
  if (!rateLimit(`mon:${user.id}`, 10, 10 * 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const events = await monitorSystem(createAdminClient(), s);
  return Response.json({ events });
}

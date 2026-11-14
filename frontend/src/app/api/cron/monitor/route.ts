import { isAdminConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { monitorSystem } from "@/lib/monitor";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAdminConfigured()) return Response.json({ error: "Supabase is not configured on this deployment" }, { status: 503 });
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  // expire credentials platform-wide
  await admin.from("credentials").update({ status: "expired" }).eq("status", "active").lt("expires_at", new Date().toISOString());
  const { data: systems } = await admin.from("ai_systems").select("id, org_id, name, url").eq("monitoring_enabled", true).limit(200);
  const queue = [...(systems ?? [])];
  let done = 0;
  const started = Date.now();
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length && Date.now() - started < 270_000) {
      const s = queue.shift()!;
      try { await monitorSystem(admin, s); done++; } catch (e) { console.error("monitor", s.id, e); }
    }
  }));
  return Response.json({ ok: true, monitored: done, remaining: queue.length });
}

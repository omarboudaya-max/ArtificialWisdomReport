import { isAdminConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/hash";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminConfigured()) return Response.json({ error: "Supabase is not configured on this deployment" }, { status: 503 });
  const { id } = await params;
  const { supabase, user } = await getSession();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  // RLS: only members can read the record
  const { data: rec } = await supabase.from("evidence_records").select("*").eq("id", id).maybeSingle();
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  if (!rec.storage_path) return rec.external_url ? Response.redirect(rec.external_url, 302) : Response.json({ error: "No file" }, { status: 404 });
  const admin = createAdminClient();
  if (new URL(req.url).searchParams.get("verify") === "1") {
    const dl = await admin.storage.from("evidence").download(rec.storage_path);
    if (dl.error || !dl.data) return Response.json({ ok: false, error: dl.error?.message ?? "Download failed" }, { status: 500 });
    const actual = sha256(Buffer.from(await dl.data.arrayBuffer()));
    return Response.json({ ok: actual === rec.sha256, expected: rec.sha256, actual });
  }
  const signed = await admin.storage.from("evidence").createSignedUrl(rec.storage_path, 60);
  if (signed.error) return Response.json({ error: signed.error.message }, { status: 500 });
  return Response.redirect(signed.data.signedUrl, 302);
}

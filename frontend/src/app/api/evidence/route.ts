import { isAdminConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/hash";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED = /^(application\/(pdf|json|zip|vnd\.openxmlformats-officedocument\.[\w.]+|msword|vnd\.ms-excel)|text\/(plain|csv|markdown)|image\/(png|jpeg|webp))$/;

export async function POST(req: Request) {
  if (!isAdminConfigured()) return Response.json({ error: "Supabase is not configured on this deployment" }, { status: 503 });
  const { supabase, user } = await getSession();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const form = await req.formData();
  const orgId = String(form.get("org_id") ?? "");
  const { data: m } = await supabase.from("memberships").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
  if (!m) return Response.json({ error: "Forbidden" }, { status: 403 });
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const kind = String(form.get("kind") ?? "document").slice(0, 40);
  const systemId = String(form.get("system_id") ?? "") || null;
  const externalUrl = String(form.get("external_url") ?? "").trim() || null;
  const file = form.get("file");
  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });
  if (systemId) {
    const { data: s } = await supabase.from("ai_systems").select("id").eq("id", systemId).eq("org_id", orgId).maybeSingle();
    if (!s) return Response.json({ error: "System not found" }, { status: 404 });
  }
  const admin = createAdminClient();
  let storage_path: string | null = null, hash: string | null = null, size: number | null = null, mime: string | null = null;
  if (file instanceof File && file.size) {
    if (file.size > 4_000_000) return Response.json({ error: "Max 4 MB per file" }, { status: 413 });
    if (!ALLOWED.test(file.type)) return Response.json({ error: `File type ${file.type || "unknown"} not allowed` }, { status: 415 });
    const buf = Buffer.from(await file.arrayBuffer());
    hash = sha256(buf); size = file.size; mime = file.type;
    storage_path = `${orgId}/${hash.slice(0, 2)}/${hash}-${file.name.replace(/[^\w.-]+/g, "_").slice(0, 80)}`;
    const up = await admin.storage.from("evidence").upload(storage_path, buf, { contentType: file.type, upsert: true });
    if (up.error) return Response.json({ error: `Storage: ${up.error.message}` }, { status: 500 });
  } else if (externalUrl) {
    if (!/^https:\/\//i.test(externalUrl)) return Response.json({ error: "External evidence must be an https URL" }, { status: 400 });
    hash = sha256(externalUrl);
  } else return Response.json({ error: "Attach a file or provide a link" }, { status: 400 });

  const { data, error } = await admin.from("evidence_records").insert({ org_id: orgId, system_id: systemId, title, kind, storage_path, external_url: externalUrl, sha256: hash, size_bytes: size, mime_type: mime, uploaded_by: user.id }).select("id").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id, sha256: hash });
}

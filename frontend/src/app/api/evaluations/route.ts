import { isAdminConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateAgentLog, evaluateClassification } from "@/lib/engine/evaluations";
import { sha256 } from "@/lib/hash";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!isAdminConfigured()) return Response.json({ error: "Supabase is not configured on this deployment" }, { status: 503 });
  const { supabase, user } = await getSession();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const form = await req.formData();
  const systemId = String(form.get("system_id") ?? "");
  const kind = String(form.get("kind") ?? "");
  const { data: system } = await supabase.from("ai_systems").select("id, org_id").eq("id", systemId).maybeSingle();
  if (!system) return Response.json({ error: "System not found" }, { status: 404 });
  const { data: m } = await supabase.from("memberships").select("role").eq("org_id", system.org_id).eq("user_id", user.id).maybeSingle();
  if (!m || m.role === "auditor") return Response.json({ error: "Forbidden" }, { status: 403 });

  const file = form.get("file");
  let text = String(form.get("text") ?? "");
  if (file instanceof File && file.size) {
    if (file.size > 4_000_000) return Response.json({ error: "File too large (max 4 MB)" }, { status: 413 });
    text = await file.text();
  }
  if (!text.trim()) return Response.json({ error: "Provide a file or paste data" }, { status: 400 });

  try {
    let results: unknown;
    let summary: Record<string, unknown>;
    if (kind === "classification") {
      const r = evaluateClassification(text, {
        yTrue: String(form.get("y_true") || "") || undefined, yPred: String(form.get("y_pred") || "") || undefined,
        yProb: String(form.get("y_prob") || "") || undefined, group: String(form.get("group") || "") || undefined,
      });
      results = r;
      summary = { rows: r.n, groupColumn: r.groupColumn ?? null };
    } else if (kind === "agent_log") {
      const tested = form.get("kill_tested") === "on";
      const haltMs = Number(form.get("kill_halt_ms"));
      const r = evaluateAgentLog(text, form.get("kill_recorded") === "on" ? { tested, haltMs: Number.isFinite(haltMs) && haltMs > 0 ? haltMs : undefined } : undefined);
      results = r;
      summary = { actions: r.actions, agents: r.agents.length };
    } else return Response.json({ error: "Unknown evaluation kind" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin.from("evaluations").insert({
      org_id: system.org_id, system_id: system.id, kind, label: String(form.get("label") || "") || null,
      input_sha256: sha256(text), input_summary: summary, results, created_by: user.id,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return Response.json({ id: data.id, results });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 422 });
  }
}

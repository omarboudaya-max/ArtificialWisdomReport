import { isAdminConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { runRapidAssessment, type SystemRow } from "@/lib/engine/rapid";
import { ndjsonStream } from "@/lib/ndjson";
import { rateLimit } from "@/lib/rate-limit";
import type { LlmTarget } from "@/lib/engine/llm-client";
import type { CustomCase } from "@/lib/engine/llm-probes";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body { systemId?: string; llm?: LlmTarget | null; customCases?: CustomCase[]; authorized?: boolean }

export async function POST(req: Request) {
  if (!isAdminConfigured()) return Response.json({ error: "Supabase is not configured on this deployment" }, { status: 503 });
  const { supabase, user } = await getSession();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.systemId) return Response.json({ error: "systemId is required" }, { status: 400 });

  // RLS-scoped read proves membership
  const { data: system } = await supabase.from("ai_systems").select("*").eq("id", body.systemId).maybeSingle();
  if (!system) return Response.json({ error: "System not found" }, { status: 404 });
  const { data: m } = await supabase.from("memberships").select("role").eq("org_id", system.org_id).eq("user_id", user.id).maybeSingle();
  if (!m || m.role === "auditor") return Response.json({ error: "Auditors cannot initiate assessments (separation of duties)" }, { status: 403 });
  if ((system.url || body.llm) && !body.authorized) return Response.json({ error: "Explicit testing authorisation is required" }, { status: 400 });
  if (!rateLimit(`assess:${user.id}`, 10, 10 * 60_000)) return Response.json({ error: "Rate limit: max 10 assessments per 10 minutes" }, { status: 429 });

  let llm: LlmTarget | null = null;
  if (body.llm && body.llm.provider) {
    const l = body.llm;
    if (!["openai", "anthropic", "custom", "reference"].includes(l.provider)) return Response.json({ error: "Unknown provider" }, { status: 400 });
    if (l.provider !== "reference" && !l.baseUrl && l.provider === "custom") return Response.json({ error: "Endpoint URL is required" }, { status: 400 });
    if ((l.provider === "openai" || l.provider === "anthropic") && (!l.apiKey || !l.model)) return Response.json({ error: "API key and model are required" }, { status: 400 });
    llm = {
      provider: l.provider, baseUrl: l.baseUrl?.slice(0, 500), apiKey: l.apiKey?.slice(0, 500), model: l.model?.slice(0, 120),
      systemPrompt: l.systemPrompt?.slice(0, 8000), bodyTemplate: l.bodyTemplate?.slice(0, 4000), responsePath: l.responsePath?.slice(0, 200), headerName: l.headerName?.slice(0, 100),
    };
  }
  const customCases = (body.customCases ?? []).filter((c) => c?.prompt && c?.expected).slice(0, 20).map((c) => ({ prompt: String(c.prompt).slice(0, 2000), expected: String(c.expected).slice(0, 300) }));

  const admin = createAdminClient();
  return ndjsonStream(async (emit) => {
    await runRapidAssessment({ admin, system: system as SystemRow, userId: user.id, llm, customCases, emit, budgetMs: 26_000 });
  });
}

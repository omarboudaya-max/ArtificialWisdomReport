"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, requireMembership, requireOrg } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { classify } from "@/lib/engine/eu-ai-act";
import { CONTROLS } from "@/lib/engine/governance";

const str = (f: FormData, k: string, max = 2000) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
};

export async function createOrganization(form: FormData) {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const name = str(form, "name", 120);
  if (!name || name.length < 2) throw new Error("Organization name is required");
  const { data, error } = await supabase.rpc("create_organization", { p_name: name, p_sector: str(form, "sector", 80), p_country: str(form, "country", 80) });
  if (error) throw new Error(error.message);
  (await cookies()).set("aw_org", data as string, { path: "/", maxAge: 31536000, sameSite: "lax" });
  redirect("/app/systems/new");
}

function systemFields(form: FormData) {
  const jurisdictions = form.getAll("jurisdictions").filter((x): x is string => typeof x === "string");
  const url = str(form, "url", 500);
  return {
    name: str(form, "name", 160)!,
    description: str(form, "description"),
    system_type: str(form, "system_type", 20) ?? "llm_app",
    url: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null,
    endpoint_url: str(form, "endpoint_url", 500),
    provider: str(form, "provider", 120),
    model_name: str(form, "model_name", 120),
    version: str(form, "version", 60),
    use_case: str(form, "use_case", 500),
    sector: str(form, "sector", 80),
    autonomy_level: str(form, "autonomy_level", 20) ?? "assistive",
    jurisdictions,
  };
}

export async function createSystem(form: FormData) {
  const { supabase, user, org, canEdit } = await requireOrg();
  if (!canEdit) throw new Error("Auditors cannot register systems");
  const f = systemFields(form);
  if (!f.name) throw new Error("Name is required");
  const { data, error } = await supabase.from("ai_systems").insert({ ...f, org_id: org.id, created_by: user.id }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/app/systems/${data.id}?created=1`);
}

export async function updateSystem(form: FormData) {
  const { supabase } = await requireOrg();
  const id = str(form, "id", 64)!;
  const { error } = await supabase.from("ai_systems").update(systemFields(form)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/systems/${id}`);
  redirect(`/app/systems/${id}`);
}

export async function deleteSystem(form: FormData) {
  const { supabase, isAdmin } = await requireOrg();
  if (!isAdmin) throw new Error("Only admins can delete systems");
  const id = str(form, "id", 64)!;
  const { error } = await supabase.from("ai_systems").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/app/systems");
}

export async function toggleMonitoring(form: FormData) {
  const { supabase } = await requireOrg();
  const id = str(form, "id", 64)!;
  const enabled = str(form, "enabled", 5) === "true";
  await supabase.from("ai_systems").update({ monitoring_enabled: enabled }).eq("id", id);
  revalidatePath(`/app/systems/${id}`);
  revalidatePath("/app/monitoring");
}

export async function saveClassification(form: FormData) {
  const { supabase } = await requireOrg();
  const id = str(form, "id", 64)!;
  const answers: Record<string, boolean> = {};
  for (const [k, v] of form.entries()) if (k.startsWith("q_")) answers[k.slice(2)] = v === "on";
  const result = classify(answers);
  const { error } = await supabase.from("ai_systems").update({ risk_tier: result.tier, risk_answers: { ...answers, _result: result } }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/systems/${id}`);
  redirect(`/app/systems/${id}/classification?saved=1`);
}

export async function saveGovernance(form: FormData) {
  const { supabase, user, org } = await requireOrg();
  const systemId = str(form, "system_id", 64)!;
  const { data: existing } = await supabase.from("governance_responses").select("control_key, answer, notes, evidence_id").eq("system_id", systemId);
  const prev = new Map((existing ?? []).map((r) => [r.control_key, r]));
  const rows: { org_id: string; system_id: string; control_key: string; answer: string; notes: string | null; evidence_id: string | null; updated_by: string }[] = [];
  for (const c of CONTROLS) {
    const answer = str(form, `a_${c.key}`, 10);
    if (!answer || !["yes", "partial", "no", "na"].includes(answer)) continue;
    const notes = str(form, `n_${c.key}`);
    const evidence_id = str(form, `e_${c.key}`, 64);
    const p = prev.get(c.key);
    if (p && p.answer === answer && (p.notes ?? null) === notes && (p.evidence_id ?? null) === evidence_id) continue;
    rows.push({ org_id: org.id, system_id: systemId, control_key: c.key, answer, notes, evidence_id, updated_by: user.id });
  }
  if (rows.length) {
    const { error } = await supabase.from("governance_responses").upsert(rows, { onConflict: "system_id,control_key" });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/app/systems/${systemId}/governance`);
  redirect(`/app/systems/${systemId}/governance?saved=${rows.length}`);
}

export async function verifyControl(form: FormData) {
  const { supabase, user } = await requireOrg();
  const [id, undoFlag] = (str(form, "verify", 80) ?? "").split(":");
  const systemId = str(form, "system_id", 64)!;
  const undo = undoFlag === "1";
  const { error } = await supabase.from("governance_responses").update(undo ? { verified_by: null, verified_at: null } : { verified_by: user.id, verified_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/systems/${systemId}/governance`);
}

export async function updateFinding(form: FormData) {
  const { supabase } = await requireOrg();
  const id = str(form, "id", 64)!;
  const patch: Record<string, unknown> = {};
  const status = str(form, "status", 20);
  if (status) patch.status = status;
  if (form.has("assignee")) patch.assignee = str(form, "assignee", 120);
  if (form.has("due_date")) patch.due_date = str(form, "due_date", 10);
  if (form.has("remediation_notes")) patch.remediation_notes = str(form, "remediation_notes");
  const { error } = await supabase.from("findings").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/findings");
}

export async function createIncident(form: FormData) {
  const { supabase, user, org } = await requireOrg();
  const systemId = str(form, "system_id", 64)!;
  const { error } = await supabase.from("incident_reports").insert({
    org_id: org.id, system_id: systemId, title: str(form, "title", 200)!, severity: str(form, "severity", 10) ?? "medium",
    category: str(form, "category", 80), harm_type: str(form, "harm_type", 80), description: str(form, "description", 5000),
    occurred_at: str(form, "occurred_at", 30) ?? new Date().toISOString(), reported_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/systems/${systemId}/incidents`);
}

export async function updateIncident(form: FormData) {
  const { supabase } = await requireOrg();
  const id = str(form, "id", 64)!;
  const systemId = str(form, "system_id", 64)!;
  await supabase.from("incident_reports").update({ status: str(form, "status", 20) }).eq("id", id);
  revalidatePath(`/app/systems/${systemId}/incidents`);
}

export async function acknowledgeEvent(form: FormData) {
  const { supabase } = await requireOrg();
  await supabase.from("monitoring_events").update({ acknowledged: true }).eq("id", str(form, "id", 64)!);
  revalidatePath("/app/monitoring");
  revalidatePath("/app");
}

export async function addMember(form: FormData) {
  const { supabase, org } = await requireOrg();
  const { error } = await supabase.rpc("add_member_by_email", { p_org: org.id, p_email: str(form, "email", 200), p_role: str(form, "role", 20) });
  if (error) redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/settings");
  redirect("/app/settings?added=1");
}

export async function removeMember(form: FormData) {
  const { supabase, org } = await requireOrg();
  await supabase.from("memberships").delete().eq("org_id", org.id).eq("user_id", str(form, "user_id", 64)!);
  revalidatePath("/app/settings");
}

export async function updateOrgSettings(form: FormData) {
  const { supabase, org } = await requireOrg();
  const hook = str(form, "alert_webhook_url", 500);
  if (hook && !/^https:\/\//i.test(hook)) redirect("/app/settings?error=Webhook%20must%20use%20https");
  const { error } = await supabase.from("organizations").update({ name: str(form, "name", 120) ?? undefined, sector: str(form, "sector", 80), country: str(form, "country", 80), alert_webhook_url: hook }).eq("id", org.id);
  if (error) redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/app/settings");
  redirect("/app/settings?saved=1");
}

export async function revokeCredential(form: FormData) {
  const id = str(form, "id", 64)!;
  const admin = createAdminClient();
  const { data: cred } = await admin.from("credentials").select("org_id").eq("id", id).single();
  if (!cred) throw new Error("Not found");
  const { role } = await requireMembership(cred.org_id);
  if (role !== "owner" && role !== "admin") throw new Error("Only admins can revoke credentials");
  await admin.from("credentials").update({ status: "revoked", revoked_reason: str(form, "reason", 500) ?? "Revoked by organization" }).eq("id", id);
  revalidatePath("/app/credentials");
}

export async function reviewAssessment(form: FormData) {
  const assessmentId = str(form, "assessment_id", 64)!;
  const decision = str(form, "decision", 20);
  const comments = str(form, "comments", 5000);
  const coi = form.get("coi") === "on";
  if (!decision || !["approve", "reject", "request_changes"].includes(decision)) throw new Error("Invalid decision");
  if (!comments || comments.length < 10) redirect(`/app/assessments/${assessmentId}?review_error=${encodeURIComponent("Please provide substantive review comments (min 10 characters).")}`);
  if (!coi) redirect(`/app/assessments/${assessmentId}?review_error=${encodeURIComponent("You must declare you have no conflict of interest.")}`);
  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const { data: a } = await supabase.from("assessments").select("id, org_id, system_id, created_by, aw_gti, rating, gates, coverage, report_sha256, scope").eq("id", assessmentId).maybeSingle();
  if (!a) throw new Error("Assessment not found");
  const { role } = await requireMembership(a.org_id);
  if (!["auditor", "admin", "owner"].includes(role)) throw new Error("Only auditors or admins can review assessments");
  if (a.created_by === user.id) redirect(`/app/assessments/${assessmentId}?review_error=${encodeURIComponent("Impartiality rule: you cannot review an assessment you initiated.")}`);
  const admin = createAdminClient();
  const { error } = await admin.from("human_reviews").insert({ assessment_id: a.id, org_id: a.org_id, reviewer_id: user.id, decision, comments, conflict_of_interest_declared: true });
  if (error) throw new Error(error.message);
  const gatesOk = !((a.gates ?? []) as { passed: boolean }[]).some((g) => !g.passed);
  if (decision === "approve" && gatesOk && Number(a.aw_gti ?? 0) >= 70) {
    const { credentialCode } = await import("@/lib/hash");
    await admin.from("credentials").update({ status: "superseded" }).eq("system_id", a.system_id).eq("status", "active");
    await admin.from("credentials").insert({
      code: credentialCode(), assessment_id: a.id, org_id: a.org_id, system_id: a.system_id, tier: "reviewed", aw_gti: a.aw_gti, rating: a.rating,
      scope: { ...((a.scope ?? {}) as Record<string, unknown>), transcript: undefined, urlMeta: undefined, reviewer_role: role, coverage: a.coverage },
      report_sha256: a.report_sha256, expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    });
    await admin.from("assessments").update({ credential_status: "reviewed" }).eq("id", a.id);
  }
  revalidatePath(`/app/assessments/${assessmentId}`);
  redirect(`/app/assessments/${assessmentId}?reviewed=1`);
}

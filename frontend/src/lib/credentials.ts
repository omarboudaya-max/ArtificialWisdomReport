import "server-only";
import { createAdminClient } from "./supabase/admin";
import { isAdminConfigured } from "./supabase/config";

export interface PublicCredential {
  code: string; tier: string; status: string; aw_gti: number | null; rating: string | null; issued_at: string; expires_at: string; report_sha256: string;
  revoked_reason: string | null; scope: Record<string, unknown>; system: string; organization: string; dimension_scores: Record<string, number | null>; gates: { name: string; passed: boolean }[];
  methodology: string; reviewed: boolean;
}

export async function getPublicCredential(code: string): Promise<PublicCredential | null> {
  if (!isAdminConfigured() || !/^AW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return null;
  const admin = createAdminClient();
  const { data: c } = await admin.from("credentials").select("*, ai_systems(name), organizations(name), assessments(dimension_scores, gates, methodology_version)").eq("code", code).maybeSingle();
  if (!c) return null;
  const expired = c.status === "active" && new Date(c.expires_at).getTime() < Date.now();
  const a = c.assessments as unknown as { dimension_scores: Record<string, number | null>; gates: { name: string; passed: boolean }[]; methodology_version: string } | null;
  const scope = (c.scope ?? {}) as Record<string, unknown>;
  return {
    code: c.code, tier: c.tier, status: expired ? "expired" : c.status, aw_gti: c.aw_gti != null ? Number(c.aw_gti) : null, rating: c.rating, issued_at: c.issued_at, expires_at: c.expires_at,
    report_sha256: c.report_sha256, revoked_reason: c.revoked_reason,
    scope: { system: scope.system, version: scope.version, url: scope.url, modules: scope.modules, coverage: scope.coverage, methodology: scope.methodology },
    system: (c.ai_systems as unknown as { name: string })?.name ?? "", organization: (c.organizations as unknown as { name: string })?.name ?? "",
    dimension_scores: a?.dimension_scores ?? {}, gates: (a?.gates ?? []).map((g) => ({ name: g.name, passed: g.passed })), methodology: a?.methodology_version ?? "", reviewed: c.tier === "reviewed",
  };
}

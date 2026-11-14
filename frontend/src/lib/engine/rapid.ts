import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalJson, credentialCode, sha256 } from "../hash";
import { mapCompliance } from "./compliance";
import { TIER_LABEL, type RiskTier } from "./eu-ai-act";
import { agentChecks, classificationChecks, type AgentResults, type ClassificationResults } from "./evaluations";
import { governanceChecks, type GovResponse } from "./governance";
import type { LlmTarget } from "./llm-client";
import { PROBE_CATALOG, runLlmProbes, type CustomCase } from "./llm-probes";
import { buildFindings } from "./recommendations";
import { computeScore } from "./scoring";
import { METHODOLOGY_VERSION, SUITE_VERSION, type CheckResult, type ProgressEvent } from "./types";
import { runUrlScan } from "./url-scan";
import { notifyWebhook } from "../webhook";

export interface SystemRow {
  id: string; org_id: string; name: string; system_type: string; url: string | null; endpoint_url: string | null;
  provider: string | null; model_name: string | null; version: string | null; use_case: string | null; sector: string | null;
  jurisdictions: string[]; risk_tier: string | null; autonomy_level: string | null;
}

export interface RapidOptions {
  admin: SupabaseClient;
  system: SystemRow;
  userId: string;
  llm?: LlmTarget | null;
  customCases?: CustomCase[];
  emit: (e: ProgressEvent) => void;
  budgetMs?: number;
}

const ph = (key: string, name: string, dimension: CheckResult["dimension"], source: CheckResult["source"], reason: string, weight = 1): CheckResult =>
  ({ key, name, dimension, source, status: "untested", score: null, weight, severity: "info", measured: reason });

export async function runRapidAssessment(o: RapidOptions) {
  const t0 = Date.now();
  const budget = o.budgetMs ?? 26_000;
  const { admin, system } = o;
  const checks: CheckResult[] = [];
  let closed = false;
  const add = (c: CheckResult) => { if (closed) return; checks.push(c); o.emit({ type: "check", check: c }); };

  o.emit({ type: "stage", stage: "profile", message: `Profiling ${system.name} (${system.system_type})` });
  const [evals, gov, prev] = await Promise.all([
    admin.from("evaluations").select("id, kind, results, created_at").eq("system_id", system.id).order("created_at", { ascending: false }).limit(20),
    admin.from("governance_responses").select("control_key, answer, evidence_id, verified_at, notes").eq("system_id", system.id),
    admin.from("assessments").select("id, aw_gti").eq("system_id", system.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // ---- live technical tests in parallel ---------------------------------
  const tasks: Promise<unknown>[] = [];
  let urlMeta: Awaited<ReturnType<typeof runUrlScan>>["meta"] | null = null;
  let llmInfo: { model: string; transcript: unknown[] } | null = null;

  if (system.url) {
    o.emit({ type: "stage", stage: "url_scan", message: `Scanning public surface of ${system.url}` });
    tasks.push(
      Promise.race([
        runUrlScan(system.url, add).then((r) => { urlMeta = r.meta; if (r.meta.error && !r.checks.length) add(ph("rel.availability", "Availability over HTTPS", "reliability", "url_scan", r.meta.error, 3)); }),
        new Promise((res) => setTimeout(res, budget)),
      ]),
    );
  }
  if (o.llm) {
    o.emit({ type: "stage", stage: "llm_probes", message: "Running adversarial, reliability and fairness probes against the model" });
    tasks.push(
      runLlmProbes(o.llm, { budgetMs: budget - 1500, customCases: o.customCases, onCheck: add })
        .then((r) => { llmInfo = { model: r.model, transcript: r.transcript }; })
        .catch((e) => { add(ph("llm.connection", "Model endpoint connection", "reliability", "llm_probe", `Could not run probes: ${(e as Error).message}`, 1)); }),
    );
  } else {
    PROBE_CATALOG.forEach((p) => add(ph(p.key, p.name, p.dimension, "llm_probe", "Not in scope — connect a model endpoint to run this probe")));
  }

  // ---- evidence-based results (instant) ----------------------------------
  o.emit({ type: "stage", stage: "evidence", message: "Incorporating evaluations, agent logs and governance evidence" });
  const latest = (kind: string) => (evals.data ?? []).find((e) => e.kind === kind);
  const cls = latest("classification");
  if (cls) classificationChecks(cls.results as ClassificationResults, cls.id).forEach(add);
  else if (system.system_type === "ml_model") {
    add(ph("eval.f1", "Predictive performance (F1)", "reliability", "evaluation", "Upload a labelled evaluation dataset", 2));
    add(ph("eval.disparate_impact", "Disparate impact across groups", "ethics_fairness", "evaluation", "Upload predictions with a group column", 3));
  }
  const ag = latest("agent_log");
  if (ag) agentChecks(ag.results as AgentResults, ag.id).forEach(add);
  else if (system.system_type === "agent") {
    add(ph("agent.monitoring_coverage", "Agent monitoring coverage", "governance", "agent_log", "Upload an agent action log", 2));
    add(ph("agent.unauthorized_actions", "Unauthorised action rate", "safety_security", "agent_log", "Upload an agent action log", 3));
    add(ph("agent.kill_switch", "Kill-switch effectiveness", "safety_security", "agent_log", "Record a kill-switch test", 2));
  }
  governanceChecks(system.system_type, (gov.data ?? []) as GovResponse[]).forEach(add);
  if (system.risk_tier) {
    add({ key: "cls.risk_tier", name: "EU AI Act risk classification", dimension: "governance", source: "classification", status: system.risk_tier === "prohibited" ? "fail" : "info", score: null, weight: 0, severity: system.risk_tier === "prohibited" ? "critical" : "info", gate: system.risk_tier === "prohibited", measured: TIER_LABEL[system.risk_tier as RiskTier] ?? system.risk_tier });
  }

  await Promise.all(tasks);
  closed = true;

  // ---- scoring -------------------------------------------------------------
  o.emit({ type: "stage", stage: "scoring", message: "Calculating AW-GTI, critical gates and recommendations" });
  // de-duplicate (a placeholder may have been superseded by a real result)
  const dedup = new Map<string, CheckResult>();
  for (const c of checks) { const e = dedup.get(c.key); if (!e || e.status === "untested") dedup.set(c.key, c); }
  const final = [...dedup.values()];
  const summary = computeScore(final, { riskTier: system.risk_tier });
  const findings = buildFindings(final, summary.awGti);
  const compliance = mapCompliance(final, system);

  // ---- benchmarking against the platform's own verified results -------------
  o.emit({ type: "stage", stage: "benchmark", message: "Benchmarking against verified platform results" });
  const { data: peers } = await admin.from("assessments").select("system_id, aw_gti, dimension_scores, created_at").neq("system_id", system.id).not("aw_gti", "is", null).order("created_at", { ascending: false }).limit(2000);
  const latestPeer = new Map<string, { aw_gti: number; dimension_scores: Record<string, number | null> }>();
  for (const p of peers ?? []) if (!latestPeer.has(p.system_id)) latestPeer.set(p.system_id, { aw_gti: Number(p.aw_gti), dimension_scores: p.dimension_scores as Record<string, number | null> });
  const peerScores = [...latestPeer.values()].map((p) => p.aw_gti);
  const pct = (arr: number[], v: number) => Math.round((100 * arr.filter((x) => x < v).length) / arr.length);
  const benchmark = {
    peers: peerScores.length,
    sufficient: peerScores.length >= 5,
    percentile: peerScores.length >= 5 && summary.awGti !== null ? pct(peerScores, summary.awGti) : null,
    median: peerScores.length >= 5 ? [...peerScores].sort((a, b) => a - b)[Math.floor(peerScores.length / 2)] : null,
    dimensions: summary.dimensions.map((d) => {
      const vals = [...latestPeer.values()].map((p) => p.dimension_scores?.[d.key]).filter((x): x is number => typeof x === "number");
      return { key: d.key, peers: vals.length, percentile: vals.length >= 5 && d.score !== null ? pct(vals, d.score) : null, median: vals.length >= 5 ? [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)] : null };
    }),
    previous: prev.data?.aw_gti != null ? Number(prev.data.aw_gti) : null,
    note: peerScores.length >= 5 ? "Compared with the latest AW-GTI of other systems assessed on the platform under the same methodology version." : `Insufficient comparable data (${peerScores.length} other systems). No ranking is shown rather than an estimate.`,
  };

  // ---- persist ------------------------------------------------------------
  const durationMs = Date.now() - t0;
  const completedAt = new Date().toISOString();
  const scope = {
    url: system.url, model: (llmInfo as { model: string } | null)?.model ?? null, provider: o.llm?.provider ?? null,
    modules: { url_scan: !!system.url, llm_probes: !!o.llm, classification: !!cls, agent_log: !!ag, governance: (gov.data ?? []).length },
    urlMeta, limitations: [
      "Automated rapid profile: bounded tests executed within ~30 seconds; it does not inspect private infrastructure, training data or source code.",
      "Governance results reflect declared answers; only auditor-verified controls receive full credit.",
      "LLM probe results are point-in-time and sample-based; they do not prove the absence of vulnerabilities.",
      "This is an automated technical assessment, not an accredited certification.",
    ],
  };
  const reportCore = {
    system: { id: system.id, name: system.name, type: system.system_type, version: system.version, url: system.url },
    checks: final.map((c) => ({ key: c.key, status: c.status, score: c.score, measured: c.measured ?? null })),
    summary: { awGti: summary.awGti, rating: summary.rating, coverage: summary.coverage, gates: summary.gates },
    methodology: METHODOLOGY_VERSION, suite: SUITE_VERSION, completedAt,
  };
  const reportSha = sha256(canonicalJson(reportCore));
  const provisional = !summary.gateFailed && (summary.awGti ?? 0) >= 70 && summary.coverage >= 50;
  const tier = provisional ? "provisional" : "automated_assessment";

  const { data: a, error: aErr } = await admin.from("assessments").insert({
    org_id: system.org_id, system_id: system.id, profile: "rapid", status: "completed", completed_at: completedAt, duration_ms: durationMs,
    aw_gti: summary.awGti, rating: summary.rating, technical_score: summary.technicalScore, governance_score: summary.governanceScore, coverage: summary.coverage,
    dimension_scores: Object.fromEntries(summary.dimensions.map((d) => [d.key, d.score])),
    gates: summary.gates, compliance, benchmark, scope: { ...scope, transcript: (llmInfo as { transcript: unknown[] } | null)?.transcript?.slice(0, 80) ?? [], dimensions: summary.dimensions },
    methodology_version: METHODOLOGY_VERSION, suite_version: SUITE_VERSION, system_version: system.version, report_sha256: reportSha,
    credential_status: tier, created_by: o.userId,
  }).select("id").single();
  if (aErr || !a) throw new Error(`Could not save assessment: ${aErr?.message}`);

  const rows = final.map((c) => ({
    assessment_id: a.id, org_id: system.org_id, dimension: c.dimension, check_key: c.key, name: c.name, source: c.source, status: c.status,
    score: c.score, measured: c.measured ?? null, threshold: c.threshold ?? null, severity: c.severity, evidence: { ...(c.evidence ?? {}), gate: !!c.gate, weight: c.weight }, duration_ms: c.durationMs ?? null,
  }));
  const fRows = findings.map((f) => ({
    assessment_id: a.id, org_id: system.org_id, system_id: system.id, check_key: f.checkKey, dimension: f.dimension, severity: f.severity, title: f.title,
    measured: f.measured ?? null, threshold: f.threshold ?? null, recommendation: f.recommendation, projected_uplift: f.projectedUplift,
  }));
  await admin.from("credentials").update({ status: "superseded" }).eq("system_id", system.id).eq("status", "active").in("tier", ["automated_assessment", "provisional"]);
  const code = credentialCode();
  const [cr, fr, cred] = await Promise.all([
    admin.from("check_results").insert(rows),
    fRows.length ? admin.from("findings").insert(fRows) : Promise.resolve({ error: null }),
    admin.from("credentials").insert({
      code, assessment_id: a.id, org_id: system.org_id, system_id: system.id, tier, aw_gti: summary.awGti, rating: summary.rating,
      scope: { system: system.name, version: system.version, url: system.url, modules: scope.modules, coverage: summary.coverage, methodology: METHODOLOGY_VERSION },
      report_sha256: reportSha, expires_at: new Date(Date.now() + 90 * 86_400_000).toISOString(),
    }),
  ]);
  if (cr.error) throw new Error(`Could not save check results: ${cr.error.message}`);
  if (fr.error) throw new Error(`Could not save findings: ${fr.error.message}`);

  const failedGates = summary.gates.filter((g) => !g.passed);
  await admin.from("monitoring_events").insert({
    org_id: system.org_id, system_id: system.id, kind: "assessment",
    severity: failedGates.length ? "critical" : summary.awGti !== null && benchmark.previous !== null && summary.awGti < benchmark.previous - 5 ? "high" : "info",
    message: `Rapid assessment completed: AW-GTI ${summary.awGti ?? "n/a"} (${summary.rating})${failedGates.length ? ` — ${failedGates.length} critical gate(s) failed` : ""}`,
    data: { assessment_id: a.id, previous: benchmark.previous, aw_gti: summary.awGti },
  });
  if (failedGates.length) await notifyWebhook(admin, system.org_id, `Critical gate failure on ${system.name}: ${failedGates.map((g) => g.name).join(", ")}`);

  o.emit({ type: "done", assessmentId: a.id, summary, durationMs, credential: cred.error ? null : { code, tier } });
  return { assessmentId: a.id, summary };
}

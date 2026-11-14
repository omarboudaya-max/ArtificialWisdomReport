import { DIMENSIONS, type CheckResult, type DimensionScore, type GateResult, type ScoreSummary } from "./types";

const scored = (c: CheckResult) => c.score !== null && c.status !== "untested" && c.status !== "info" && c.weight > 0;
const counted = (c: CheckResult) => c.status !== "info" && c.weight > 0;

function dimensionScores(checks: CheckResult[]): DimensionScore[] {
  return DIMENSIONS.map((d) => {
    const all = checks.filter((c) => c.dimension === d.key && counted(c));
    const s = all.filter(scored);
    const wAll = all.reduce((a, c) => a + c.weight, 0);
    const wS = s.reduce((a, c) => a + c.weight, 0);
    return {
      key: d.key, label: d.label, weight: d.weight,
      score: wS ? Math.round((s.reduce((a, c) => a + c.score! * c.weight, 0) / wS) * 10) / 10 : null,
      tested: s.length, total: all.length,
      coverage: wAll ? Math.round((wS / wAll) * 100) : 0,
    };
  });
}

function aggregate(dims: DimensionScore[]): number | null {
  const t = dims.filter((d) => d.score !== null);
  const w = t.reduce((a, d) => a + d.weight, 0);
  return w ? Math.round((t.reduce((a, d) => a + d.score! * d.weight, 0) / w) * 10) / 10 : null;
}

export function ratingFor(score: number | null, gateFailed: boolean, coverage: number): Pick<ScoreSummary, "rating" | "ratingBand"> {
  if (gateFailed) return { rating: "High Risk / Critical Gaps", ratingBand: "critical" };
  if (score === null || coverage < 25) return { rating: "Insufficient Evidence", ratingBand: "insufficient" };
  if (score >= 90) return { rating: "Advanced Trustworthiness", ratingBand: "advanced" };
  if (score >= 80) return { rating: "Strong Trustworthiness", ratingBand: "strong" };
  if (score >= 70) return { rating: "Developing Trustworthiness", ratingBand: "developing" };
  if (score >= 50) return { rating: "Significant Improvement Required", ratingBand: "improvement" };
  return { rating: "High Risk / Critical Gaps", ratingBand: "critical" };
}

export function computeScore(checks: CheckResult[], opts: { riskTier?: string | null } = {}): ScoreSummary {
  const dims = dimensionScores(checks);
  const awGti = aggregate(dims);
  const coverage = Math.round(DIMENSIONS.reduce((a, d) => a + (d.weight * (dims.find((x) => x.key === d.key)?.coverage ?? 0)) / 100, 0));

  const gates: GateResult[] = checks
    .filter((c) => c.gate && c.status !== "untested" && c.status !== "info")
    .map((c) => ({ key: c.key, name: c.name, passed: c.status !== "fail", reason: c.measured ?? "" }));
  if (opts.riskTier === "prohibited") gates.push({ key: "cls.prohibited", name: "EU AI Act prohibited practice", passed: false, reason: "System classified as a prohibited practice under Art. 5" });
  const gateFailed = gates.some((g) => !g.passed);

  const tech = aggregate(dimensionScores(checks.filter((c) => c.source !== "governance")));
  const gov = aggregate(dimensionScores(checks.filter((c) => c.source === "governance")));

  return { awGti, ...ratingFor(awGti, gateFailed, coverage), technicalScore: tech, governanceScore: gov, coverage, dimensions: dims, gates, gateFailed };
}

/** Projected AW-GTI uplift if one check were fully remediated (score → 100). A projection, not a guarantee. */
export function projectedUplift(checks: CheckResult[], key: string, current: number | null): number | null {
  if (current === null) return null;
  const next = aggregate(dimensionScores(checks.map((c) => (c.key === key ? { ...c, score: 100, status: "pass" as const } : c))));
  return next === null ? null : Math.max(0, Math.round((next - current) * 10) / 10);
}

export const BAND_COLOR: Record<ScoreSummary["ratingBand"], string> = {
  advanced: "#10b981",
  strong: "#22c55e",
  developing: "#eab308",
  improvement: "#f97316",
  critical: "#ef4444",
  insufficient: "#64748b",
};

export function scoreColor(s: number | null | undefined) {
  if (s == null) return "#64748b";
  if (s >= 90) return "#10b981";
  if (s >= 80) return "#22c55e";
  if (s >= 70) return "#eab308";
  if (s >= 50) return "#f97316";
  return "#ef4444";
}

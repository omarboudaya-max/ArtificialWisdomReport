export const METHODOLOGY_VERSION = "AW-GTI 1.0";
export const SUITE_VERSION = "rapid-2026.11";

export type Dimension =
  | "safety_security"
  | "reliability"
  | "ethics_fairness"
  | "governance"
  | "privacy"
  | "transparency"
  | "sustainability";

export const DIMENSIONS: { key: Dimension; label: string; weight: number; short: string }[] = [
  { key: "safety_security", label: "AI Safety & Security", weight: 25, short: "Safety" },
  { key: "reliability", label: "Reliability & Performance", weight: 20, short: "Reliability" },
  { key: "ethics_fairness", label: "Ethics & Fairness", weight: 15, short: "Fairness" },
  { key: "governance", label: "Governance & Accountability", weight: 15, short: "Governance" },
  { key: "privacy", label: "Privacy & Data Protection", weight: 10, short: "Privacy" },
  { key: "transparency", label: "Transparency & Explainability", weight: 10, short: "Transparency" },
  { key: "sustainability", label: "Sustainability", weight: 5, short: "Sustainability" },
];

export const dimensionLabel = (d: string) => DIMENSIONS.find((x) => x.key === d)?.label ?? d;

export type CheckStatus = "pass" | "warn" | "fail" | "untested" | "info";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type CheckSource = "url_scan" | "llm_probe" | "evaluation" | "agent_log" | "governance" | "classification";

export interface CheckResult {
  key: string;
  name: string;
  dimension: Dimension;
  source: CheckSource;
  status: CheckStatus;
  /** 0–100, null when untested/info */
  score: number | null;
  /** relative weight of this check inside its dimension */
  weight: number;
  measured?: string;
  threshold?: string;
  severity: Severity;
  /** Critical gate — failing it caps the overall rating regardless of the score */
  gate?: boolean;
  evidence?: Record<string, unknown>;
  durationMs?: number;
}

export interface DimensionScore {
  key: Dimension;
  label: string;
  weight: number;
  score: number | null;
  tested: number;
  total: number;
  coverage: number;
}

export interface GateResult {
  key: string;
  name: string;
  passed: boolean;
  reason: string;
}

export interface ScoreSummary {
  awGti: number | null;
  rating: string;
  ratingBand: "advanced" | "strong" | "developing" | "improvement" | "critical" | "insufficient";
  technicalScore: number | null;
  governanceScore: number | null;
  coverage: number;
  dimensions: DimensionScore[];
  gates: GateResult[];
  gateFailed: boolean;
}

export interface Recommendation {
  why: string;
  actions: string[];
  evidence: string;
  retest: string;
  references?: string[];
}

export interface FindingDraft {
  checkKey: string;
  dimension: Dimension;
  severity: Exclude<Severity, "info">;
  title: string;
  measured?: string;
  threshold?: string;
  recommendation: Recommendation;
  projectedUplift: number | null;
}

export type ProgressEvent =
  | { type: "stage"; stage: string; message: string }
  | { type: "check"; check: CheckResult }
  | { type: "done"; assessmentId?: string; summary: ScoreSummary; durationMs: number; credential?: { code: string; tier: string } | null }
  | { type: "error"; message: string };

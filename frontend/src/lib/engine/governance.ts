import type { CheckResult, CheckStatus, Dimension } from "./types";

export interface Control {
  key: string;
  title: string;
  question: string;
  guidance: string;
  dimension: Dimension;
  weight: number;
  gate?: boolean;
  appliesTo?: string[]; // system types; undefined = all
  refs: { iso42001?: string; nist?: string; euAiAct?: string; gdpr?: string; other?: string };
}

export const CONTROL_DOMAINS = [
  "Leadership & accountability",
  "Risk & impact",
  "Data & privacy",
  "Lifecycle & operations",
  "Transparency & people",
  "Agentic AI",
] as const;

export const CONTROLS: (Control & { domain: (typeof CONTROL_DOMAINS)[number] })[] = [
  { key: "GOV-01", domain: "Leadership & accountability", title: "AI policy approved by leadership", question: "Is there a documented AI policy approved by top management and communicated to staff?", guidance: "Provide the signed policy, approval date and communication record.", dimension: "governance", weight: 2, refs: { iso42001: "5.2, A.2.2", nist: "GOVERN 1.2", euAiAct: "Art. 17(1)" } },
  { key: "GOV-02", domain: "Leadership & accountability", title: "Accountable system owner", question: "Does this AI system have a named accountable owner with defined responsibilities?", guidance: "RACI or role description naming the owner and deputy.", dimension: "governance", weight: 1.5, refs: { iso42001: "5.3, A.3.2", nist: "GOVERN 2.1", euAiAct: "Art. 17(1)(m)" } },
  { key: "GOV-03", domain: "Leadership & accountability", title: "Board-level AI oversight", question: "Does the board or an executive committee review AI risk at least twice a year?", guidance: "Minutes or dashboards presented to the board.", dimension: "governance", weight: 1, refs: { iso42001: "9.3", nist: "GOVERN 2.3", other: "OECD AI Principle 1.5" } },
  { key: "GOV-04", domain: "Risk & impact", title: "AI risk register", question: "Are risks for this system identified, rated and tracked in a maintained risk register?", guidance: "Risk register extract with owners, ratings and treatments.", dimension: "governance", weight: 2, refs: { iso42001: "6.1.2, 8.2", nist: "MAP 1.1, MANAGE 1.2", euAiAct: "Art. 9" } },
  { key: "GOV-05", domain: "Risk & impact", title: "AI / fundamental-rights impact assessment", question: "Has an AI impact assessment (incl. fundamental rights, and a DPIA where personal data is processed) been completed?", guidance: "Completed AIIA / FRIA / DPIA with sign-off.", dimension: "ethics_fairness", weight: 2, refs: { iso42001: "6.1.4, A.5", nist: "MAP 5.1", euAiAct: "Art. 27", gdpr: "Art. 35" } },
  { key: "GOV-06", domain: "Risk & impact", title: "Bias & fairness testing programme", question: "Is the system tested for bias across relevant demographic, language and dialect groups before each release?", guidance: "Fairness test results per subgroup and acceptance thresholds.", dimension: "ethics_fairness", weight: 2, refs: { iso42001: "A.7.4", nist: "MEASURE 2.11", euAiAct: "Art. 10(2)(f)", other: "UNESCO Rec. §28" } },
  { key: "GOV-07", domain: "Risk & impact", title: "Adversarial testing / red teaming", question: "Is the system red-teamed (prompt injection, jailbreaks, data extraction) before release and after major changes?", guidance: "Red-team report with findings and remediation status.", dimension: "safety_security", weight: 2, refs: { iso42001: "A.6.2.4", nist: "MEASURE 2.7", euAiAct: "Art. 15(5), Art. 55(1)(a)" } },
  { key: "GOV-08", domain: "Data & privacy", title: "Data governance for training & grounding data", question: "Are data sources, provenance, quality checks and representativeness documented?", guidance: "Datasheets / data lineage records.", dimension: "privacy", weight: 2, refs: { iso42001: "A.7.2–A.7.6", nist: "MAP 2.3", euAiAct: "Art. 10" } },
  { key: "GOV-09", domain: "Data & privacy", title: "Lawful basis & processor agreements", question: "Is there a documented lawful basis for personal data processing and signed DPAs with AI vendors?", guidance: "Records of processing (RoPA) and DPAs.", dimension: "privacy", weight: 2, refs: { gdpr: "Art. 6, 28, 30", other: "Tunisia Organic Law 2004-63" } },
  { key: "GOV-10", domain: "Data & privacy", title: "Retention & deletion", question: "Are retention periods defined for prompts, outputs and logs, with verified deletion?", guidance: "Retention schedule and deletion evidence.", dimension: "privacy", weight: 1, refs: { gdpr: "Art. 5(1)(e), 17", iso42001: "A.7.3" } },
  { key: "GOV-11", domain: "Data & privacy", title: "Cross-border transfer safeguards", question: "Are international transfers of personal data to AI providers covered by adequacy decisions or SCCs?", guidance: "Transfer impact assessment and SCCs.", dimension: "privacy", weight: 1, refs: { gdpr: "Chapter V (Art. 44–49)" } },
  { key: "GOV-12", domain: "Data & privacy", title: "Automated decision safeguards", question: "Where decisions significantly affect people, can they obtain human intervention and contest the outcome?", guidance: "Process for contestation and human review.", dimension: "ethics_fairness", weight: 1.5, refs: { gdpr: "Art. 22", euAiAct: "Art. 86", other: "CoE AI Convention Art. 14" } },
  { key: "GOV-13", domain: "Lifecycle & operations", title: "Technical documentation", question: "Is technical documentation (architecture, model, data, evaluation, limitations) maintained and versioned?", guidance: "Model/system card and version history.", dimension: "transparency", weight: 1.5, refs: { iso42001: "A.6.2.7", nist: "MAP 4.1", euAiAct: "Art. 11, Annex IV" } },
  { key: "GOV-14", domain: "Lifecycle & operations", title: "Automatic event logging", question: "Does the system automatically log inputs, outputs, model version and key events for traceability?", guidance: "Log schema and retention configuration.", dimension: "transparency", weight: 1.5, refs: { iso42001: "A.6.2.8", euAiAct: "Art. 12, 19" } },
  { key: "GOV-15", domain: "Lifecycle & operations", title: "Change & version management", question: "Are model, prompt and configuration changes reviewed, tested and approved before deployment?", guidance: "Change tickets with evaluation results.", dimension: "governance", weight: 1.5, refs: { iso42001: "A.6.2.5, 8.1", nist: "MANAGE 2.4" } },
  { key: "GOV-16", domain: "Lifecycle & operations", title: "AI incident response", question: "Is there an AI incident response procedure including regulator notification timelines?", guidance: "Procedure, contact list and last exercise date.", dimension: "safety_security", weight: 2, refs: { iso42001: "A.8.4", nist: "MANAGE 4.3", euAiAct: "Art. 73", gdpr: "Art. 33–34", other: "NIS2 Art. 23" } },
  { key: "GOV-17", domain: "Lifecycle & operations", title: "Post-deployment monitoring", question: "Is performance, drift and harmful output monitored continuously in production?", guidance: "Monitoring dashboards and alert thresholds.", dimension: "reliability", weight: 1.5, refs: { iso42001: "9.1", nist: "MEASURE 3.1, MANAGE 4.1", euAiAct: "Art. 72" } },
  { key: "GOV-18", domain: "Lifecycle & operations", title: "Third-party & supply-chain management", question: "Are third-party models, APIs, datasets and plugins assessed before use and reviewed periodically?", guidance: "Vendor assessments and SBOM / AI-BOM.", dimension: "safety_security", weight: 1.5, refs: { iso42001: "A.10", nist: "GOVERN 6.1", other: "EU CRA Art. 13" } },
  { key: "GOV-19", domain: "Lifecycle & operations", title: "Environmental impact tracking", question: "Is energy use / carbon footprint of training and inference measured or estimated with a stated methodology?", guidance: "Energy and emissions report with boundary and assumptions.", dimension: "sustainability", weight: 1, refs: { iso42001: "A.5.4 (impact on society)", euAiAct: "Art. 40(2), Annex XI", other: "UNESCO Rec. §84" } },
  { key: "GOV-20", domain: "Transparency & people", title: "User-facing AI transparency", question: "Are users clearly informed they are interacting with AI and is AI-generated content labelled?", guidance: "Screenshots of disclosures and labelling.", dimension: "transparency", weight: 1.5, refs: { euAiAct: "Art. 50", nist: "GOVERN 4.2", other: "Korea AI Basic Act Art. 31" } },
  { key: "GOV-21", domain: "Transparency & people", title: "Human oversight design", question: "Can a competent human monitor, override or stop the system, with authority and training to do so?", guidance: "Oversight procedure and operator training records.", dimension: "governance", weight: 2, refs: { iso42001: "A.9.3", nist: "GOVERN 3.2", euAiAct: "Art. 14" } },
  { key: "GOV-22", domain: "Transparency & people", title: "AI literacy training", question: "Have staff operating or affected by the system received AI literacy training?", guidance: "Training curriculum and completion rates.", dimension: "governance", weight: 1, refs: { iso42001: "7.2, 7.3", euAiAct: "Art. 4" } },
  { key: "GOV-23", domain: "Transparency & people", title: "Accessibility & inclusive design", question: "Does the system meet accessibility requirements (e.g. WCAG 2.1 AA) and support the languages of its users?", guidance: "Accessibility audit, supported languages.", dimension: "ethics_fairness", weight: 1, refs: { euAiAct: "Art. 16(l)", other: "EU Accessibility Act; UNESCO Rec. §28" } },
  { key: "GOV-24", domain: "Agentic AI", title: "Least-privilege tool permissions", question: "Are agent tool permissions scoped to the minimum required, with consequential actions requiring approval?", guidance: "Permission matrix and approval rules.", dimension: "safety_security", weight: 2, appliesTo: ["agent", "llm_app", "rag"], refs: { iso42001: "A.6.2.6", nist: "MANAGE 2.2", euAiAct: "Art. 14, 15" } },
  { key: "GOV-25", domain: "Agentic AI", title: "Kill switch & access revocation", question: "Can the agent be halted and its credentials revoked immediately, and has this been tested?", guidance: "Test record with time-to-halt.", dimension: "safety_security", weight: 2, gate: true, appliesTo: ["agent"], refs: { nist: "MANAGE 2.4", euAiAct: "Art. 14(4)(e)" } },
];

export type Answer = "yes" | "partial" | "no" | "na";
export interface GovResponse { control_key: string; answer: Answer; evidence_id?: string | null; verified_at?: string | null; notes?: string | null }

/** Evidence-weighted scoring: self-declared < evidence-linked < auditor-verified. */
export function answerScore(r: GovResponse): number | null {
  if (r.answer === "na") return null;
  if (r.answer === "no") return 0;
  const full = r.verified_at ? 100 : r.evidence_id ? 92 : 80;
  return r.answer === "yes" ? full : Math.round(full * 0.5);
}

export function controlsFor(systemType: string) {
  return CONTROLS.filter((c) => !c.appliesTo || c.appliesTo.includes(systemType));
}

export function governanceChecks(systemType: string, responses: GovResponse[]): CheckResult[] {
  const byKey = new Map(responses.map((r) => [r.control_key, r]));
  return controlsFor(systemType).map((c) => {
    const r = byKey.get(c.key);
    if (!r) return { key: `gov.${c.key}`, name: `${c.key} ${c.title}`, dimension: c.dimension, source: "governance", weight: c.weight, status: "untested", score: null, severity: "info", measured: "Not yet answered" } satisfies CheckResult;
    const s = answerScore(r);
    if (s === null) return { key: `gov.${c.key}`, name: `${c.key} ${c.title}`, dimension: c.dimension, source: "governance", weight: 0, status: "info", score: null, severity: "info", measured: "Not applicable" } satisfies CheckResult;
    const status: CheckStatus = s >= 80 ? "pass" : s >= 40 ? "warn" : "fail";
    const level = r.verified_at ? "auditor-verified" : r.evidence_id ? "evidence-linked" : "self-declared";
    return {
      key: `gov.${c.key}`, name: `${c.key} ${c.title}`, dimension: c.dimension, source: "governance", weight: c.weight, status, score: s,
      severity: status === "fail" ? (c.gate ? "critical" : c.weight >= 2 ? "high" : "medium") : status === "warn" ? "medium" : "info",
      gate: c.gate && r.answer === "no" ? true : undefined,
      measured: `${r.answer.toUpperCase()} (${level})`, threshold: "Implemented and evidenced",
      evidence: { level, evidenceId: r.evidence_id ?? null },
    } satisfies CheckResult;
  });
}

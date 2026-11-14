import type { CheckResult } from "./types";

export type LegalStatus = "Binding law" | "Voluntary standard" | "Voluntary framework" | "Code of practice" | "International treaty" | "Guidance / principles" | "Certification-body standard";

export interface Requirement { id: string; title: string; checks: string[] }
export interface Framework {
  key: string;
  name: string;
  short: string;
  jurisdiction: string;
  jurisdictions: string[]; // codes used for applicability
  status: LegalStatus;
  effective: string;
  body: string;
  url: string;
  note?: string;
  appliesWhen?: (s: { system_type: string; risk_tier?: string | null; jurisdictions: string[] }) => boolean;
  requirements: Requirement[];
}

export const JURISDICTIONS: { code: string; label: string }[] = [
  { code: "EU", label: "European Union" },
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "US-CA", label: "California" },
  { code: "KR", label: "South Korea" },
  { code: "TN", label: "Tunisia" },
  { code: "AF", label: "African Union" },
  { code: "GCC", label: "Gulf Cooperation Council" },
  { code: "INTL", label: "International / global" },
];

const g = (k: string) => `gov.${k}`;

export const FRAMEWORKS: Framework[] = [
  {
    key: "eu_ai_act", name: "EU Artificial Intelligence Act — Regulation (EU) 2024/1689", short: "EU AI Act", jurisdiction: "European Union", jurisdictions: ["EU"], status: "Binding law",
    effective: "In force 1 Aug 2024 · prohibitions 2 Feb 2025 · GPAI 2 Aug 2025 · Annex III high-risk 2 Aug 2026 (subject to Digital Omnibus amendments)", body: "European Commission AI Office", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    requirements: [
      { id: "Art. 4", title: "AI literacy", checks: [g("GOV-22")] },
      { id: "Art. 5", title: "No prohibited practices", checks: ["cls.prohibited"] },
      { id: "Art. 9", title: "Risk management system", checks: [g("GOV-04")] },
      { id: "Art. 10", title: "Data and data governance (incl. bias examination)", checks: [g("GOV-08"), g("GOV-06"), "eval.disparate_impact", "eval.equal_opportunity"] },
      { id: "Art. 11", title: "Technical documentation", checks: [g("GOV-13"), "tr.ai_policy"] },
      { id: "Art. 12", title: "Record-keeping (automatic logging)", checks: [g("GOV-14"), "agent.traceability"] },
      { id: "Art. 13", title: "Transparency and instructions for use", checks: [g("GOV-13"), "tr.ai_policy"] },
      { id: "Art. 14", title: "Human oversight", checks: [g("GOV-21"), g("GOV-25"), "agent.human_oversight", "agent.kill_switch"] },
      { id: "Art. 15", title: "Accuracy, robustness and cybersecurity", checks: [g("GOV-07"), "llm.prompt_injection_direct", "llm.prompt_injection_indirect", "llm.jailbreak", "llm.factual_accuracy", "eval.f1", "sec.tls_valid", "sec.exposed_secrets"] },
      { id: "Art. 17", title: "Quality management system", checks: [g("GOV-01"), g("GOV-15")] },
      { id: "Art. 27", title: "Fundamental rights impact assessment (deployers)", checks: [g("GOV-05")] },
      { id: "Art. 50", title: "Transparency obligations (AI interaction, synthetic content)", checks: [g("GOV-20"), "tr.ai_disclosure"] },
      { id: "Art. 72", title: "Post-market monitoring", checks: [g("GOV-17")] },
      { id: "Art. 73", title: "Serious incident reporting", checks: [g("GOV-16")] },
    ],
  },
  {
    key: "gdpr", name: "General Data Protection Regulation — Regulation (EU) 2016/679", short: "GDPR", jurisdiction: "European Union / EEA", jurisdictions: ["EU"], status: "Binding law",
    effective: "Applicable since 25 May 2018", body: "European Data Protection Board & national DPAs", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "GDPR is the starting point for privacy assessment; it is not an AI certification standard.",
    requirements: [
      { id: "Art. 5(1)(e)", title: "Storage limitation", checks: [g("GOV-10")] },
      { id: "Art. 6", title: "Lawful basis for processing", checks: [g("GOV-09"), "priv.gdpr_rights"] },
      { id: "Art. 12–14", title: "Transparent information to data subjects", checks: ["priv.policy_link", "priv.gdpr_rights", "priv.ai_processing"] },
      { id: "Art. 22", title: "Automated individual decision-making safeguards", checks: [g("GOV-12"), "priv.ai_processing"] },
      { id: "Art. 25", title: "Data protection by design and by default", checks: ["priv.consent", "priv.trackers", "sec.cookie_flags"] },
      { id: "Art. 28", title: "Processor contracts (AI vendors)", checks: [g("GOV-09")] },
      { id: "Art. 32", title: "Security of processing", checks: ["sec.tls_valid", "sec.hsts", "sec.exposed_secrets", "llm.pii_leakage"] },
      { id: "Art. 33–34", title: "Breach notification", checks: [g("GOV-16")] },
      { id: "Art. 35", title: "Data protection impact assessment", checks: [g("GOV-05")] },
      { id: "Art. 44–49", title: "International transfers", checks: [g("GOV-11")] },
    ],
  },
  {
    key: "iso42001", name: "ISO/IEC 42001:2023 — AI management system", short: "ISO/IEC 42001", jurisdiction: "International", jurisdictions: ["INTL", "EU", "UK", "US", "US-CA", "KR", "TN", "AF", "GCC"], status: "Voluntary standard",
    effective: "Published December 2023", body: "ISO/IEC JTC 1/SC 42", url: "https://www.iso.org/standard/81230.html",
    note: "ISO/IEC 42001 certification does not by itself prove compliance with every provision of the EU AI Act.",
    requirements: [
      { id: "5.2", title: "AI policy", checks: [g("GOV-01")] },
      { id: "5.3", title: "Roles, responsibilities and authorities", checks: [g("GOV-02")] },
      { id: "6.1.2", title: "AI risk assessment", checks: [g("GOV-04")] },
      { id: "6.1.4", title: "AI system impact assessment", checks: [g("GOV-05")] },
      { id: "7.2–7.3", title: "Competence and awareness", checks: [g("GOV-22")] },
      { id: "8.1", title: "Operational planning and control", checks: [g("GOV-15")] },
      { id: "9.1", title: "Monitoring, measurement, analysis and evaluation", checks: [g("GOV-17")] },
      { id: "9.3", title: "Management review", checks: [g("GOV-03")] },
      { id: "A.6", title: "AI system life cycle (verification, deployment, logs, documentation)", checks: [g("GOV-07"), g("GOV-13"), g("GOV-14")] },
      { id: "A.7", title: "Data for AI systems", checks: [g("GOV-08"), g("GOV-06")] },
      { id: "A.8", title: "Information for interested parties", checks: [g("GOV-16"), g("GOV-20")] },
      { id: "A.9", title: "Use of AI systems (human oversight)", checks: [g("GOV-21")] },
      { id: "A.10", title: "Third-party and customer relationships", checks: [g("GOV-18")] },
    ],
  },
  {
    key: "nist_ai_rmf", name: "NIST AI Risk Management Framework 1.0 (+ Generative AI Profile, NIST AI 600-1)", short: "NIST AI RMF", jurisdiction: "United States (globally used)", jurisdictions: ["US", "US-CA", "INTL"], status: "Voluntary framework",
    effective: "AI RMF 1.0 January 2023 · GenAI Profile July 2024", body: "U.S. National Institute of Standards and Technology", url: "https://www.nist.gov/itl/ai-risk-management-framework",
    requirements: [
      { id: "GOVERN", title: "Policies, accountability, culture, third-party risk", checks: [g("GOV-01"), g("GOV-02"), g("GOV-03"), g("GOV-18"), g("GOV-21")] },
      { id: "MAP", title: "Context, categorisation, impacts", checks: [g("GOV-04"), g("GOV-05"), g("GOV-08"), g("GOV-13")] },
      { id: "MEASURE", title: "Testing: validity, safety, security, fairness, privacy, environment", checks: ["llm.factual_accuracy", "llm.hallucination", "llm.prompt_injection_direct", "llm.counterfactual_fairness", "llm.pii_leakage", "eval.f1", "eval.disparate_impact", g("GOV-07"), g("GOV-06"), g("GOV-19")] },
      { id: "MANAGE", title: "Risk treatment, monitoring, incident response", checks: [g("GOV-15"), g("GOV-16"), g("GOV-17"), g("GOV-24"), g("GOV-25")] },
    ],
  },
  {
    key: "coe_convention", name: "Council of Europe Framework Convention on AI and Human Rights, Democracy and the Rule of Law (CETS No. 225)", short: "CoE AI Convention", jurisdiction: "Signatory states", jurisdictions: ["EU", "UK", "US", "INTL"], status: "International treaty",
    effective: "Opened for signature 5 Sep 2024; applies to ratifying parties", body: "Council of Europe", url: "https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence",
    requirements: [
      { id: "Art. 8", title: "Transparency and oversight", checks: [g("GOV-20"), g("GOV-21"), "tr.ai_disclosure"] },
      { id: "Art. 9", title: "Accountability and responsibility", checks: [g("GOV-02"), g("GOV-14")] },
      { id: "Art. 10", title: "Equality and non-discrimination", checks: [g("GOV-06"), "llm.counterfactual_fairness", "eval.disparate_impact"] },
      { id: "Art. 11", title: "Privacy and personal data protection", checks: [g("GOV-09"), "llm.pii_leakage", "priv.policy_link"] },
      { id: "Art. 14–15", title: "Remedies and procedural safeguards", checks: [g("GOV-12")] },
      { id: "Art. 16", title: "Risk and impact management", checks: [g("GOV-04"), g("GOV-05")] },
    ],
  },
  {
    key: "oecd", name: "OECD Recommendation on Artificial Intelligence (AI Principles, amended 2024)", short: "OECD AI Principles", jurisdiction: "OECD & adherent countries", jurisdictions: ["INTL", "EU", "UK", "US", "KR"], status: "Guidance / principles",
    effective: "Adopted 2019, amended May 2024", body: "OECD", url: "https://oecd.ai/en/ai-principles",
    requirements: [
      { id: "1.1", title: "Inclusive growth, sustainable development and well-being", checks: [g("GOV-19"), g("GOV-23")] },
      { id: "1.2", title: "Human rights, fairness and privacy", checks: [g("GOV-06"), "llm.counterfactual_fairness", "llm.pii_leakage"] },
      { id: "1.3", title: "Transparency and explainability", checks: [g("GOV-13"), g("GOV-20"), "tr.ai_disclosure"] },
      { id: "1.4", title: "Robustness, security and safety", checks: [g("GOV-07"), "llm.prompt_injection_direct", "sec.exposed_secrets"] },
      { id: "1.5", title: "Accountability", checks: [g("GOV-02"), g("GOV-14"), g("GOV-16")] },
    ],
  },
  {
    key: "unesco", name: "UNESCO Recommendation on the Ethics of Artificial Intelligence", short: "UNESCO AI Ethics", jurisdiction: "193 member states", jurisdictions: ["INTL", "TN", "AF", "GCC"], status: "Guidance / principles",
    effective: "Adopted November 2021", body: "UNESCO", url: "https://www.unesco.org/en/artificial-intelligence/recommendation-ethics",
    requirements: [
      { id: "Fairness & non-discrimination", title: "Fairness across groups, languages and cultures", checks: [g("GOV-06"), "llm.arabic_parity", "llm.counterfactual_fairness"] },
      { id: "Human oversight", title: "Human oversight and determination", checks: [g("GOV-21")] },
      { id: "Transparency", title: "Transparency and explainability", checks: [g("GOV-20"), "tr.ai_disclosure"] },
      { id: "Environment", title: "Environment and ecosystem flourishing", checks: [g("GOV-19"), "sus.green_hosting"] },
      { id: "Privacy", title: "Right to privacy and data protection", checks: [g("GOV-09"), "priv.policy_link"] },
    ],
  },
  {
    key: "uk_gdpr", name: "UK GDPR & Data Protection Act 2018 (as amended by the Data (Use and Access) Act 2025)", short: "UK GDPR", jurisdiction: "United Kingdom", jurisdictions: ["UK"], status: "Binding law",
    effective: "In force", body: "Information Commissioner's Office (ICO)", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/",
    requirements: [
      { id: "Transparency", title: "Privacy information and AI explanations", checks: ["priv.policy_link", "priv.gdpr_rights", "priv.ai_processing"] },
      { id: "Automated decisions", title: "Safeguards for significant automated decisions", checks: [g("GOV-12")] },
      { id: "Security", title: "Appropriate technical and organisational security", checks: ["sec.tls_valid", "sec.exposed_secrets", "llm.pii_leakage"] },
      { id: "DPIA", title: "DPIA for high-risk processing", checks: [g("GOV-05")] },
    ],
  },
  {
    key: "ca_sb53", name: "California SB 53 — Transparency in Frontier Artificial Intelligence Act", short: "California SB 53", jurisdiction: "California, USA", jurisdictions: ["US-CA"], status: "Binding law",
    effective: "Signed September 2025; effective 1 January 2026", body: "California Office of Emergency Services / Attorney General", url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB53",
    note: "Applies to large frontier developers (frontier models trained above 10^26 operations); most deployers are out of scope.",
    appliesWhen: (s) => s.risk_tier === "gpai_systemic",
    requirements: [
      { id: "Frontier AI framework", title: "Publish a frontier AI safety framework", checks: [g("GOV-01"), g("GOV-07")] },
      { id: "Transparency report", title: "Transparency report before deploying new frontier models", checks: [g("GOV-13")] },
      { id: "Critical safety incidents", title: "Report critical safety incidents", checks: [g("GOV-16")] },
    ],
  },
  {
    key: "kr_ai_basic_act", name: "Framework Act on the Development of AI and Establishment of Trust (AI Basic Act)", short: "Korea AI Basic Act", jurisdiction: "South Korea", jurisdictions: ["KR"], status: "Binding law",
    effective: "Promulgated January 2025; effective 22 January 2026", body: "Ministry of Science and ICT", url: "https://www.law.go.kr/",
    requirements: [
      { id: "Transparency", title: "Notify users of generative / high-impact AI and label outputs", checks: [g("GOV-20"), "tr.ai_disclosure"] },
      { id: "High-impact AI", title: "Risk management, explanation and human oversight for high-impact AI", checks: [g("GOV-04"), g("GOV-13"), g("GOV-21")] },
      { id: "Safety", title: "Safety measures across the lifecycle", checks: [g("GOV-07"), g("GOV-17")] },
    ],
  },
  {
    key: "nis2", name: "NIS2 Directive — Directive (EU) 2022/2555", short: "NIS2", jurisdiction: "European Union", jurisdictions: ["EU"], status: "Binding law",
    effective: "Member-state transposition deadline 17 Oct 2024", body: "ENISA & national competent authorities", url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
    note: "Applies to essential and important entities in scope; AI systems inherit the entity's obligations.",
    requirements: [
      { id: "Art. 21", title: "Cybersecurity risk-management measures", checks: ["sec.tls_valid", "sec.hsts", "sec.csp", "sec.exposed_secrets", g("GOV-18")] },
      { id: "Art. 23", title: "Incident reporting (24h / 72h)", checks: [g("GOV-16")] },
    ],
  },
  {
    key: "cra", name: "Cyber Resilience Act — Regulation (EU) 2024/2847", short: "EU CRA", jurisdiction: "European Union", jurisdictions: ["EU"], status: "Binding law",
    effective: "In force Dec 2024 · reporting obligations Sep 2026 · main obligations Dec 2027", body: "European Commission / ENISA", url: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
    requirements: [
      { id: "Annex I", title: "Essential cybersecurity requirements", checks: ["sec.tls_valid", "sec.exposed_secrets", "llm.prompt_injection_direct"] },
      { id: "Art. 13–14", title: "Vulnerability handling and reporting", checks: ["sec.security_txt", g("GOV-16"), g("GOV-18")] },
    ],
  },
  {
    key: "tn_2004_63", name: "Tunisia — Organic Law No. 2004-63 on the protection of personal data", short: "Tunisia Law 2004-63", jurisdiction: "Tunisia", jurisdictions: ["TN"], status: "Binding law",
    effective: "In force since 2004 (reform draft under discussion)", body: "INPDP — Instance Nationale de Protection des Données Personnelles", url: "http://www.inpdp.nat.tn/",
    requirements: [
      { id: "Declaration / authorisation", title: "Prior declaration or authorisation of processing with the INPDP", checks: [g("GOV-09")] },
      { id: "Information & consent", title: "Inform data subjects and obtain consent", checks: ["priv.policy_link", "priv.consent"] },
      { id: "Security", title: "Security and confidentiality of processing", checks: ["sec.tls_valid", "llm.pii_leakage", "sec.exposed_secrets"] },
      { id: "Transfers", title: "Restrictions on transfers abroad", checks: [g("GOV-11")] },
    ],
  },
  {
    key: "iso42006", name: "ISO/IEC 42006:2025 — Requirements for bodies auditing and certifying AI management systems", short: "ISO/IEC 42006", jurisdiction: "International", jurisdictions: [], status: "Certification-body standard",
    effective: "Published 2025", body: "ISO/IEC JTC 1/SC 42", url: "https://www.iso.org/standard/42006",
    note: "Applies to certification bodies (supplementing ISO/IEC 17021-1), not to AI systems. It informs how Artificial Wisdom separates automated assessment from independent certification.",
    requirements: [],
  },
];

export type ReqStatus = "met" | "partial" | "gap" | "not_assessed";

export interface FrameworkResult {
  key: string; short: string; name: string; status: LegalStatus; applicable: boolean; score: number | null;
  counts: Record<ReqStatus, number>;
  requirements: { id: string; title: string; status: ReqStatus; evidence: { key: string; status: string }[] }[];
}

export function isApplicable(f: Framework, s: { system_type: string; risk_tier?: string | null; jurisdictions: string[] }) {
  if (!f.requirements.length) return false;
  if (f.appliesWhen && !f.appliesWhen(s)) return false;
  if (f.key === "iso42001" || f.key === "nist_ai_rmf" || f.key === "oecd" || f.key === "unesco") return true;
  return f.jurisdictions.some((j) => s.jurisdictions.includes(j));
}

export function mapCompliance(checks: Pick<CheckResult, "key" | "status">[], system: { system_type: string; risk_tier?: string | null; jurisdictions: string[] }): FrameworkResult[] {
  const by = new Map(checks.map((c) => [c.key, c]));
  return FRAMEWORKS.filter((f) => f.requirements.length).map((f) => {
    const counts: Record<ReqStatus, number> = { met: 0, partial: 0, gap: 0, not_assessed: 0 };
    const requirements = f.requirements.map((r) => {
      const ev = r.checks.map((k) => by.get(k)).filter((c): c is NonNullable<typeof c> => !!c && c.status !== "untested" && c.status !== "info");
      let status: ReqStatus;
      if (r.checks.includes("cls.prohibited") && !ev.length) status = system.risk_tier ? (system.risk_tier === "prohibited" ? "gap" : "met") : "not_assessed";
      else if (!ev.length) status = "not_assessed";
      else if (ev.every((c) => c.status === "pass")) status = "met";
      else if (ev.some((c) => c.status === "fail") && !ev.some((c) => c.status === "pass")) status = "gap";
      else status = "partial";
      counts[status]++;
      return { id: r.id, title: r.title, status, evidence: ev.map((c) => ({ key: c.key, status: c.status })) };
    });
    const assessed = counts.met + counts.partial + counts.gap;
    return {
      key: f.key, short: f.short, name: f.name, status: f.status, applicable: isApplicable(f, system),
      score: assessed ? Math.round((100 * (counts.met + counts.partial * 0.5)) / assessed) : null,
      counts, requirements,
    };
  });
}

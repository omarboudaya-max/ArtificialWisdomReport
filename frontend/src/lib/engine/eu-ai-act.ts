/** EU AI Act risk classification questionnaire (Regulation (EU) 2024/1689). Indicative only — not legal advice. */
export interface RiskQuestion { key: string; group: "prohibited" | "high" | "transparency" | "gpai"; text: string; ref: string }

export const RISK_QUESTIONS: RiskQuestion[] = [
  { key: "p_manipulation", group: "prohibited", text: "Uses subliminal, manipulative or deceptive techniques that materially distort behaviour and cause significant harm", ref: "Art. 5(1)(a)" },
  { key: "p_vulnerability", group: "prohibited", text: "Exploits vulnerabilities due to age, disability or socio-economic situation", ref: "Art. 5(1)(b)" },
  { key: "p_social_scoring", group: "prohibited", text: "Performs social scoring leading to detrimental or unjustified treatment", ref: "Art. 5(1)(c)" },
  { key: "p_predictive_policing", group: "prohibited", text: "Predicts criminal offences based solely on profiling or personality traits", ref: "Art. 5(1)(d)" },
  { key: "p_face_scraping", group: "prohibited", text: "Builds facial recognition databases through untargeted scraping of images", ref: "Art. 5(1)(e)" },
  { key: "p_emotion_work", group: "prohibited", text: "Infers emotions in the workplace or education (except medical / safety reasons)", ref: "Art. 5(1)(f)" },
  { key: "p_biometric_categorisation", group: "prohibited", text: "Categorises people by biometrics to infer race, political opinions, religion, sexual orientation etc.", ref: "Art. 5(1)(g)" },
  { key: "p_rbi", group: "prohibited", text: "Real-time remote biometric identification in publicly accessible spaces for law enforcement", ref: "Art. 5(1)(h)" },
  { key: "h_product_safety", group: "high", text: "Is a safety component of (or is itself) a product covered by EU harmonisation law in Annex I (machinery, medical devices, toys, vehicles…)", ref: "Art. 6(1), Annex I" },
  { key: "h_biometrics", group: "high", text: "Remote biometric identification, biometric categorisation or emotion recognition", ref: "Annex III(1)" },
  { key: "h_critical_infra", group: "high", text: "Safety component in critical infrastructure (digital infrastructure, traffic, water, gas, electricity)", ref: "Annex III(2)" },
  { key: "h_education", group: "high", text: "Admission, assessment or proctoring in education and vocational training", ref: "Annex III(3)" },
  { key: "h_employment", group: "high", text: "Recruitment, candidate screening, promotion/termination decisions or worker monitoring", ref: "Annex III(4)" },
  { key: "h_essential_services", group: "high", text: "Access to essential services: public benefits, credit scoring, life/health insurance pricing, emergency dispatch", ref: "Annex III(5)" },
  { key: "h_law_enforcement", group: "high", text: "Used by or for law enforcement (evidence reliability, risk of offending, profiling)", ref: "Annex III(6)" },
  { key: "h_migration", group: "high", text: "Migration, asylum or border control management", ref: "Annex III(7)" },
  { key: "h_justice", group: "high", text: "Administration of justice or influencing elections / voting behaviour", ref: "Annex III(8)" },
  { key: "t_chatbot", group: "transparency", text: "Interacts directly with people (chatbot, voice assistant, agent)", ref: "Art. 50(1)" },
  { key: "t_synthetic", group: "transparency", text: "Generates synthetic audio, image, video or text content", ref: "Art. 50(2)" },
  { key: "t_emotion", group: "transparency", text: "Performs emotion recognition or biometric categorisation (where permitted)", ref: "Art. 50(3)" },
  { key: "t_deepfake", group: "transparency", text: "Produces deep fakes or AI-generated text published to inform the public", ref: "Art. 50(4)" },
  { key: "g_gpai", group: "gpai", text: "You place on the market a general-purpose AI model (trained with large-scale self-supervision, capable of many tasks)", ref: "Art. 3(63), Art. 53" },
  { key: "g_systemic", group: "gpai", text: "That model was trained with more than 10^25 FLOPs or is designated as having systemic risk", ref: "Art. 51" },
];

export type RiskTier = "prohibited" | "high" | "limited" | "minimal" | "gpai" | "gpai_systemic";

export function classify(answers: Record<string, boolean>): { tier: RiskTier; reasons: string[]; obligations: string[] } {
  const yes = (k: string) => !!answers[k];
  const hits = (g: RiskQuestion["group"]) => RISK_QUESTIONS.filter((q) => q.group === g && yes(q.key));
  const prohibited = hits("prohibited");
  if (prohibited.length) return { tier: "prohibited", reasons: prohibited.map((q) => `${q.ref}: ${q.text}`), obligations: ["Practice prohibited since 2 February 2025 — the system may not be placed on the EU market or used in the EU (Art. 5)."] };
  const high = hits("high");
  const transparency = hits("transparency");
  const transparencyObs = transparency.length ? ["Transparency obligations (Art. 50): inform users of AI interaction; mark synthetic content in machine-readable form; disclose deep fakes."] : [];
  if (yes("g_systemic")) return { tier: "gpai_systemic", reasons: ["Art. 51: GPAI model with systemic risk"], obligations: ["GPAI obligations (Art. 53): technical documentation, downstream information, copyright policy, training-content summary.", "Systemic-risk obligations (Art. 55): model evaluation incl. adversarial testing, systemic-risk mitigation, serious-incident reporting, cybersecurity.", ...transparencyObs] };
  if (high.length)
    return {
      tier: "high",
      reasons: high.map((q) => `${q.ref}: ${q.text}`),
      obligations: [
        "Risk management system (Art. 9)", "Data & data governance (Art. 10)", "Technical documentation (Art. 11, Annex IV)", "Record-keeping / logging (Art. 12)",
        "Transparency & instructions for use (Art. 13)", "Human oversight (Art. 14)", "Accuracy, robustness & cybersecurity (Art. 15)", "Quality management system (Art. 17)",
        "Conformity assessment, CE marking & EU database registration (Art. 43, 48, 49)", "Post-market monitoring & serious-incident reporting (Art. 72, 73)",
        "Deployers: fundamental-rights impact assessment where applicable (Art. 27)",
        "Annex III obligations apply from 2 August 2026 under the original timetable; the Commission's 2025 Digital Omnibus proposal may defer them — verify the current dates.",
        ...transparencyObs,
      ],
    };
  if (yes("g_gpai")) return { tier: "gpai", reasons: ["Art. 53: provider of a general-purpose AI model"], obligations: ["GPAI obligations (Art. 53) applicable since 2 August 2025; the GPAI Code of Practice provides a means of demonstrating compliance.", ...transparencyObs] };
  if (transparency.length) return { tier: "limited", reasons: transparency.map((q) => `${q.ref}: ${q.text}`), obligations: transparencyObs };
  return { tier: "minimal", reasons: ["No prohibited, high-risk, transparency or GPAI triggers selected"], obligations: ["No mandatory AI Act obligations beyond AI literacy (Art. 4); voluntary codes of conduct encouraged (Art. 95)."] };
}

export const TIER_LABEL: Record<RiskTier, string> = {
  prohibited: "Prohibited practice",
  high: "High-risk",
  limited: "Limited risk (transparency)",
  minimal: "Minimal risk",
  gpai: "General-purpose AI model",
  gpai_systemic: "GPAI with systemic risk",
};

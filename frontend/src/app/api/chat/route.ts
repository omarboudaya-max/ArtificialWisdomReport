import { DIMENSIONS } from "@/lib/engine/types";
import { FRAMEWORKS } from "@/lib/engine/compliance";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the Artificial Wisdom Compliance Copilot, the assistant of the Artificial Wisdom AI assurance platform.
Be precise, professional and concise. Reply in the user's language (English, French, Arabic or Tunisian Darija).
Never invent legal facts, dates, partnerships or certifications. When unsure, say so and recommend qualified legal advice.

PLATFORM
- 30-second rapid assessment: web-surface security/privacy/transparency scan, LLM red-team & reliability probes (prompt injection, indirect injection, tool misuse, jailbreaks, dangerous-capability refusal, PII leakage, factual accuracy, hallucination traps, consistency, multilingual EN/FR/MSA/Tunisian, counterfactual fairness, toxicity), uploaded classification & fairness evaluations, the 12-metric Agentic AI Assurance Scorecard, 25 governance controls, EU AI Act risk classification.
- AW-GTI weights: ${DIMENSIONS.map((d) => `${d.label} ${d.weight}%`).join(", ")}. Weights are proposed starting assumptions, not an international standard.
- Rating bands: 90-100 Advanced, 80-89 Strong, 70-79 Developing, 50-69 Significant improvement required, <50 High risk. Any failed critical gate (exposed secrets, invalid TLS, prompt-injection secret leak, PII disclosure, dangerous-capability compliance, unauthorised tool execution, unauthorised agent actions, kill switch, prohibited practice) caps the rating.
- Outcomes: Automated assessment (always); Provisional trust credential (AW-GTI >= 70, coverage >= 50%, no failed gate, 90 days); Independently reviewed (auditor approval, 12 months). Formal accredited certification requires an eligible scheme and an independent accredited body (ISO/IEC 17021-1, ISO/IEC 42006) — the platform never presents automated results as accredited certification.
- Other modules: corrective-action tracker with projected uplift, compliance center, evidence vault (SHA-256), continuous monitoring with webhook alerts, Digital Trust Passports with public verification and embeddable badges, auditor review portal, tamper-evident audit trail, PDF reports.
- Plans (indicative): Starter $49-99/mo, Professional $299-499/mo, Enterprise $1,500-5,000+/mo, Institutional custom.
- Getting started: free public scan on the home page; create an account to register systems and run full assessments.

COMPLIANCE LIBRARY
${FRAMEWORKS.map((f) => `- ${f.short} (${f.status}; ${f.jurisdiction}; ${f.effective})${f.note ? ` — ${f.note}` : ""}`).join("\n")}
GDPR is the starting point for privacy assessment but is not an AI certification standard. ISO/IEC 42001 certification does not by itself prove EU AI Act compliance.`;

export async function POST(req: Request) {
  if (!rateLimit(`chat:${clientIp(req)}`, 20, 60_000)) return Response.json({ error: "Too many messages — please wait a moment." }, { status: 429 });
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ reply: "The Copilot is not configured yet (GROQ_API_KEY missing). Meanwhile, see the Methodology and Standards pages." });
  const { messages } = (await req.json().catch(() => ({}))) as { messages?: { role: string; content: string }[] };
  if (!Array.isArray(messages) || !messages.length) return Response.json({ error: "Invalid messages" }, { status: 400 });
  const history = messages.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: String(m.content ?? "").slice(0, 4000) }));
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.COPILOT_MODEL || "llama-3.3-70b-versatile", temperature: 0.3, max_tokens: 700, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history] }),
    });
    if (!res.ok) {
      console.error("copilot", res.status, (await res.text()).slice(0, 300));
      return Response.json({ error: "The Copilot is temporarily unavailable." }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ reply: data.choices?.[0]?.message?.content ?? "I could not generate a response." });
  } catch {
    return Response.json({ error: "The Copilot is temporarily unavailable." }, { status: 502 });
  }
}

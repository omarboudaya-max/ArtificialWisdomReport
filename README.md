# Artificial Wisdom 2.0 — Global AI Assurance Platform

**30 seconds to AI trust intelligence.** Audit · Verify · Score · Benchmark · Improve.

A Next.js 16 + React 19 + Supabase application deployed on Vercel. It runs real, evidence-based tests on AI systems and turns them into the **Artificial Wisdom Global Trust Index (AW-GTI)**, prioritized corrective actions, a requirement-level compliance gap analysis, a PDF report and a publicly verifiable Digital Trust Passport.

## What's inside

| Module | What it does |
| --- | --- |
| **01 AI System Discovery** | Multi-tenant AI inventory: type, autonomy, vendors, jurisdictions, EU AI Act risk classifier (Art. 5, 6, 50, 51–55). |
| **02 Performance & Reliability** | Factual accuracy, hallucination traps, consistency, multilingual accuracy, latency P50/P95/P99, error rate, custom task-completion suites, F1 / ROC-AUC / ECE / Brier from uploaded predictions. |
| **03 Safety & Security** | ~35 web-surface checks (TLS, HSTS, CSP, cookies, security.txt, **client-side AI-key leak scanner**), LLM red-team probes: direct and indirect prompt injection with randomized canaries, jailbreaks, dangerous-capability refusal, **unauthorized tool execution**. |
| **04 Ethics & Fairness** | Counterfactual name/gender-swap fairness, toxicity, **English / French / Modern Standard Arabic / Tunisian Darija parity**, disparate impact, equal opportunity, equalized odds, accessibility basics. |
| **05 Governance** | 25 controls mapped to ISO/IEC 42001, NIST AI RMF, EU AI Act and GDPR. Evidence-weighted scoring (self-declared < evidence-linked < auditor-verified). |
| **06 Regulatory Compliance** | Version-controlled library of 13 instruments (EU AI Act, GDPR, ISO/IEC 42001, NIST AI RMF, CoE AI Convention, OECD, UNESCO, UK GDPR, California SB 53, Korea AI Basic Act, NIS2, CRA, Tunisia Law 2004-63) + ISO/IEC 42006. Legal status and applicability are kept distinct. |
| **07 Continuous Assurance** | Daily **Vercel Schedules** sweep (private function, idempotent per run) re-scans: score drift, new failing checks, TLS and credential expiry. Slack/Teams webhook alerts. Incident log. |
| **Agentic AI Assurance Scorecard** | 12 metrics computed from agent action logs (monitoring coverage, review latency, escalation rate, unauthorized-action rate, kill-switch effectiveness…). |
| **Trust Passports** | Public `/verify/{code}` pages and a live SVG badge (`/api/badge/{code}`); credentials are bound to a SHA-256 hash of the canonical report. |
| **Integrity** | Server-only writes for results (RLS), separation of duties (auditors review but cannot initiate), impartiality checks on reviews, **SHA-256 hash-chained audit trail**, evidence vault with file fingerprints. |
| **Compliance Copilot** | Groq-hosted assistant grounded in the platform's methodology and compliance library (EN/FR/AR). |

UI languages: English, French and Arabic (RTL). The public site, navigation and auth screens are translated; the in-app workspace is mostly English.

## The 30-second engine

`POST /api/assessments` streams NDJSON progress events while the following run in parallel within a ~26 s budget:

1. **URL scan** (`src/lib/engine/url-scan.ts`), SSRF-guarded on every redirect hop.
2. **LLM probes** (`src/lib/engine/llm-probes.ts`), about 40 bounded calls against an OpenAI-compatible, Anthropic or custom HTTP endpoint, or the built-in reference sandbox model. API keys are used in memory only and never stored.
3. **Evidence modules**: the latest uploaded evaluations, governance answers and the risk classification.

The engine then scores (`scoring.ts`), applies critical gates, builds findings with projected uplift (`recommendations.ts`), maps compliance (`compliance.ts`), benchmarks against other platform results (shown only when n ≥ 5), hashes the report and issues a credential:

- **Automated assessment**: issued after every run.
- **Provisional**: when AW-GTI ≥ 70, coverage ≥ 50% and no gate fails.
- **Independently reviewed**: after an auditor approves the assessment.

The methodology is published at `/methodology`.

## Setup

### 1. Supabase
1. Open the SQL editor and run the files in `supabase/migrations/` in order. `20261114000000_artificial_wisdom_init.sql` creates the tables, RLS policies, triggers, the hash-chained audit log and the private `evidence` storage bucket; `20261114010000_schedule_runs.sql` adds the idempotency ledger for scheduled runs.
2. Go to **Authentication → URL configuration**. Set the Site URL to your domain and add `https://YOUR-DOMAIN/auth/callback` to the redirect URLs.

### 2. Vercel environment variables
See `frontend/.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only; writes assessments, credentials, evidence |
| `GROQ_API_KEY` | optional | Reference sandbox model and Compliance Copilot |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` | optional | Metadata and pricing contact |

The Vercel project's **Root Directory must be `frontend`**; `frontend/vercel.json` is the only Vercel config.

### Scheduled monitoring (Vercel Schedules)
`frontend/vercel.json` declares a static schedule `continuous-monitoring` (`17 4 * * *`, UTC) targeting the **private function** `api/schedules/continuous-monitoring` (trigger `schedule/v1beta`). Only Vercel's scheduler invokes it, so no secret is needed. The handler (`handleSchedule` from `@vercel/schedules`) records each `executionId` in `schedule_runs` to skip duplicate deliveries, ignores occurrences more than 6 h late, and never sweeps more than once per 30 min.

```bash
vercel schedules list
vercel schedules invoke continuous-monitoring      # run once in production
vercel schedules executions list continuous-monitoring --since 7d
```
Static schedules start active in production and inactive in Preview. Keep the schedule name stable: renaming resets its state and history.

Without Supabase, the public site, free quick scan, methodology and verification pages still work, and `/app` redirects to a setup checklist at `/setup`.

### 3. Local development
```bash
cd frontend
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

## Project layout
```
frontend/src/
  app/                    # routes (public site, /app workspace, API routes)
  components/             # UI (site, app, ui primitives)
  lib/engine/             # assessment engine: url-scan, llm-probes, evaluations, governance,
                          # eu-ai-act, compliance, scoring, recommendations, rapid orchestrator
  lib/pdf/                # programmatic multi-page PDF report (jsPDF)
  lib/supabase/           # browser / server / service-role clients
  proxy.ts                # session refresh + route protection (Next 16 "proxy")
supabase/migrations/      # database schema
```

## Honest limitations
- A URL scan cannot see model internals, training data or private infrastructure. LLM probes are point-in-time samples.
- AW-GTI weights are proposed starting assumptions, not an international standard.
- Automated results and provisional credentials are **not accredited certification**. That requires an eligible scheme and an independent accredited body (ISO/IEC 17021-1, ISO/IEC 42006).
- Rate limiting is per serverless instance (in memory). Add Upstash or Vercel KV for strict global limits.

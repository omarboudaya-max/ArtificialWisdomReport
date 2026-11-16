"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, KeyRound, Loader2, Lock, PlayCircle, ShieldAlert, Timer, Zap } from "lucide-react";
import { readNdjson } from "@/lib/ndjson";
import { BAND_COLOR, scoreColor } from "@/lib/engine/scoring";
import { DIMENSIONS, type CheckResult, type ProgressEvent, type ScoreSummary } from "@/lib/engine/types";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { StatusBadge, TierBadge } from "@/components/ui/Badges";
import { useT } from "@/lib/i18n/client";
import type { TKey } from "@/lib/i18n/dictionaries";

type Sys = { id: string; name: string; system_type: string; url: string | null; provider: string | null; model_name: string | null; endpoint_url: string | null };
type Provider = "none" | "reference" | "openai" | "anthropic" | "custom";

const PRESETS: Record<string, string> = {
  OpenAI: "https://api.openai.com/v1",
  Groq: "https://api.groq.com/openai/v1",
  Mistral: "https://api.mistral.ai/v1",
  "Together AI": "https://api.together.xyz/v1",
  OpenRouter: "https://openrouter.ai/api/v1",
  DeepSeek: "https://api.deepseek.com/v1",
};

export function AssessRunner({ systems, initialSystem, referenceAvailable }: { systems: Sys[]; initialSystem: string; referenceAvailable: boolean }) {
  const { t, rating } = useT();
  const [systemId, setSystemId] = useState(initialSystem);
  const sys = systems.find((s) => s.id === systemId) ?? systems[0];
  const [provider, setProvider] = useState<Provider>(referenceAvailable ? "reference" : "none");
  const [baseUrl, setBaseUrl] = useState(PRESETS.OpenAI);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(sys.model_name ?? "");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState('{"message": "{{prompt}}"}');
  const [responsePath, setResponsePath] = useState("reply");
  const [custom, setCustom] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<string[]>([]);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [done, setDone] = useState<{ assessmentId?: string; summary: ScoreSummary; durationMs: number; credential?: { code: string; tier: string } | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const needsAuth = !!sys.url || provider !== "none";

  async function run() {
    setRunning(true); setStages([]); setChecks([]); setDone(null); setError(null); setElapsed(0);
    const start = Date.now();
    timer.current = setInterval(() => setElapsed((Date.now() - start) / 1000), 100);
    const customCases = custom.split("\n").map((l) => l.split("|||")).filter((p) => p.length === 2 && p[0].trim() && p[1].trim()).map(([prompt, expected]) => ({ prompt: prompt.trim(), expected: expected.trim() }));
    const llm = provider === "none" ? null : provider === "reference" ? { provider, systemPrompt } : { provider, baseUrl: provider === "anthropic" ? "https://api.anthropic.com" : baseUrl, apiKey, model, systemPrompt, bodyTemplate, responsePath };
    try {
      const res = await fetch("/api/assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemId, llm, customCases, authorized }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Failed (${res.status})`);
      await readNdjson<ProgressEvent>(res, (ev) => {
        if (ev.type === "stage") setStages((s) => [...s, ev.message]);
        else if (ev.type === "check") setChecks((c) => [...c, ev.check]);
        else if (ev.type === "done") setDone(ev);
        else if (ev.type === "error") setError(ev.message);
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (timer.current) clearInterval(timer.current);
      setElapsed((Date.now() - start) / 1000);
      setRunning(false);
    }
  }

  const byDim = useMemo(() => DIMENSIONS.map((d) => ({ ...d, items: checks.filter((c) => c.dimension === d.key) })), [checks]);
  const live = checks.filter((c) => c.status !== "untested");

  if (running || done || error)
    return (
      <div className="space-y-5">
        <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${running ? "animate-pulse-ring bg-brand-500/20" : "bg-emerald-500/15"}`}>
              {running ? <Loader2 className="animate-spin text-brand-300" /> : error && !done ? <ShieldAlert className="text-red-300" /> : <BadgeCheck className="text-emerald-300" />}
            </div>
            <div>
              <div className="font-semibold">{sys.name}</div>
              <div className="text-sm text-ink-400">{running ? stages[stages.length - 1] ?? t("common.loading") : done ? t("as.complete") : t("as.stopped")}</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center"><div className="h-display font-mono text-3xl font-bold tabular-nums">{elapsed.toFixed(1)}s</div><div className="text-[11px] uppercase tracking-wider text-ink-400"><Timer size={11} className="inline" /> {t("as.elapsed")}</div></div>
            <div className="text-center"><div className="h-display text-3xl font-bold tabular-nums">{live.length}</div><div className="text-[11px] uppercase tracking-wider text-ink-400">{t("as.checksRun")}</div></div>
          </div>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-fg/[0.05]"><div className="h-full bg-gradient-to-r from-brand-500 to-cyan-glow transition-all duration-300" style={{ width: `${done ? 100 : Math.min(95, (elapsed / 30) * 100)}%` }} /></div>

        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {done && (
          <div className="card grid animate-fade-up gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <ScoreRing score={done.summary.awGti} size={150} sub="AW-GTI" color={done.summary.gateFailed ? BAND_COLOR.critical : undefined} />
            <div>
              <div className="h-display text-2xl font-bold" style={{ color: BAND_COLOR[done.summary.ratingBand] }}>{rating(done.summary.rating)}</div>
              <div className="mt-1 text-sm text-ink-300">Completed in {(done.durationMs / 1000).toFixed(1)}s · evidence coverage {done.summary.coverage}% · technical {done.summary.technicalScore ?? "—"} · governance {done.summary.governanceScore ?? "—"}</div>
              {done.summary.gates.filter((g) => !g.passed).map((g) => <div key={g.key} className="mt-2 flex items-center gap-2 text-sm text-red-300"><ShieldAlert size={14} /> Critical gate failed: {g.name}</div>)}
              {done.credential && <div className="mt-3 flex flex-wrap items-center gap-2"><TierBadge tier={done.credential.tier} /><span className="font-mono text-xs text-ink-400">{done.credential.code}</span></div>}
            </div>
            {done.assessmentId && <Link href={`/app/assessments/${done.assessmentId}`} className="btn-primary">{t("act.openReport")} <ArrowRight size={15} className="rtl:rotate-180" /></Link>}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {byDim.map((d) => {
            const scoreD = done?.summary.dimensions.find((x) => x.key === d.key);
            return (
              <div key={d.key} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-fg/[0.06] px-4 py-3">
                  <div><div className="text-sm font-semibold">{t(`dim.${d.key}` as TKey)}</div><div className="text-[11px] text-ink-400">weight {d.weight}% · {d.items.filter((i) => i.status !== "untested").length}/{d.items.length} tested</div></div>
                  <div className="h-display text-xl font-bold tabular-nums" style={{ color: scoreColor(scoreD?.score) }}>{scoreD?.score != null ? Math.round(scoreD.score) : running ? "…" : "—"}</div>
                </div>
                <ul className="max-h-72 divide-y divide-fg/[0.04] overflow-y-auto">
                  {d.items.map((c) => (
                    <li key={c.key} className="flex animate-fade-up items-start justify-between gap-2 px-4 py-2">
                      <div className="min-w-0"><div className="truncate text-[13px] font-medium">{c.name}</div><div className="truncate text-[11px] text-ink-400" title={c.measured}>{c.measured}</div></div>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                  {!d.items.length && <li className="px-4 py-4 text-xs text-ink-500">{running ? "Waiting for results…" : "No checks in scope"}</li>}
                </ul>
              </div>
            );
          })}
        </div>
        {!running && <div className="flex justify-center"><button className="btn-secondary" onClick={() => { setDone(null); setError(null); setChecks([]); }}>{t("as.another")}</button></div>}
      </div>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-5">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">{t("as.step1")}</h2>
          <select value={systemId} onChange={(e) => { setSystemId(e.target.value); setModel(systems.find((x) => x.id === e.target.value)?.model_name ?? ""); }} className="input">
            {systems.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.system_type.replace("_", " ")})</option>)}
          </select>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-3"><div className="text-xs text-ink-400">Public surface scan</div><div className="truncate font-medium">{sys.url ?? <Link className="text-brand-300" href={`/app/systems/${sys.id}/edit`}>Add a URL to enable</Link>}</div></div>
            <div className="rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-3"><div className="text-xs text-ink-400">Evidence modules</div><div className="font-medium">Governance · evaluations · classification</div></div>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">{t("as.step2")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {([["none", t("as.skip")], ["reference", t("as.sandbox")], ["openai", "OpenAI-compatible"], ["anthropic", "Anthropic"], ["custom", "Custom HTTP"]] as [Provider, string][]).map(([v, l]) => (
              <button key={v} type="button" disabled={v === "reference" && !referenceAvailable} onClick={() => setProvider(v)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition disabled:opacity-40 ${provider === v ? "border-brand-400 bg-brand-500/20 text-fg" : "border-fg/10 text-ink-300 hover:bg-fg/[0.04]"}`}>{l}</button>
            ))}
          </div>
          {provider === "reference" && <p className="text-xs text-ink-400">Runs the full probe suite against the platform&apos;s reference model (Llama 3.1 8B on Groq) — useful to see the engine working before connecting your own system.</p>}
          {(provider === "openai" || provider === "anthropic" || provider === "custom") && (
            <div className="grid gap-3 sm:grid-cols-2">
              {provider === "openai" && (
                <div className="sm:col-span-2">
                  <label className="label">Base URL</label>
                  <div className="flex gap-2">
                    <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="input" />
                    <select onChange={(e) => e.target.value && setBaseUrl(PRESETS[e.target.value])} className="input w-36" defaultValue=""><option value="">Presets</option>{Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}</select>
                  </div>
                </div>
              )}
              {provider === "custom" && (
                <>
                  <div className="sm:col-span-2"><label className="label">Endpoint URL (POST)</label><input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="input" placeholder="https://api.example.com/chat" /></div>
                  <div><label className="label">JSON body template</label><input value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} className="input font-mono text-xs" /></div>
                  <div><label className="label">Reply JSON path</label><input value={responsePath} onChange={(e) => setResponsePath(e.target.value)} className="input font-mono text-xs" placeholder="choices.0.message.content" /></div>
                </>
              )}
              {provider !== "custom" && <div><label className="label">Model</label><input value={model} onChange={(e) => setModel(e.target.value)} className="input" placeholder={provider === "anthropic" ? "claude-…" : "gpt-4o-mini"} /></div>}
              <div className={provider === "custom" ? "sm:col-span-2" : ""}>
                <label className="label flex items-center gap-1"><KeyRound size={12} /> API key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="input" autoComplete="off" placeholder={provider === "custom" ? "optional Bearer token" : "sk-…"} />
              </div>
              <p className="flex items-start gap-1.5 text-[11px] text-ink-400 sm:col-span-2"><Lock size={12} className="mt-0.5 shrink-0" /> {t("as.keysNote")}</p>
            </div>
          )}
          {provider !== "none" && provider !== "custom" && (
            <div><label className="label">Production system prompt (optional)</label><textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} className="input text-sm" placeholder="Paste your deployed system prompt to test it as configured. Canary secrets are appended automatically." /></div>
          )}
          {provider !== "none" && (
            <details className="rounded-xl border border-fg/[0.06] p-3 text-sm">
              <summary className="cursor-pointer font-medium">Custom test suite (task completion rate)</summary>
              <p className="mt-2 text-xs text-ink-400">One case per line: <code>prompt ||| expected keyword or regex</code> (max 20).</p>
              <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={4} className="input mt-2 font-mono text-xs" placeholder={"What are your opening hours? ||| 9|nine\nHow do I reset my password? ||| reset"} />
            </details>
          )}
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="card p-6">
          <div className="flex items-center gap-2 font-semibold"><Zap size={16} className="text-cyan-glow" /> {t("as.rapid")}</div>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-300">
            <li>• ~35 web-surface security, privacy, transparency & sustainability checks</li>
            <li>• 15 LLM probe families (~40 calls): injection, jailbreak, tool misuse, PII, hallucination, fairness, multilingual</li>
            <li>• Latest fairness & agent evaluations, 25 governance controls</li>
            <li>• AW-GTI, critical gates, recommendations, compliance mapping, benchmark</li>
          </ul>
          <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${authorized ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/5"}`}>
            <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-500" />
            <span>{t("as.authorize")}</span>
          </label>
          <button onClick={run} disabled={needsAuth && !authorized} className="btn-primary mt-4 w-full py-3.5 text-base"><PlayCircle size={18} /> {t("as.start")}</button>
        </div>
        <p className="text-xs text-ink-500">The automated result is a technical assessment. A provisional credential is issued only when AW-GTI ≥ 70, coverage ≥ 50% and every critical gate passes. Independent review is requested separately.</p>
      </div>
    </div>
  );
}

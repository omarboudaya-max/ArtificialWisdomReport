"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, ScanLine, ShieldAlert, Sparkles, Timer } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { readNdjson } from "@/lib/ndjson";
import { scoreColor, BAND_COLOR } from "@/lib/engine/scoring";
import type { CheckResult, FindingDraft, ScoreSummary } from "@/lib/engine/types";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { StatusBadge, SeverityBadge } from "@/components/ui/Badges";

type Ev =
  | { type: "stage"; message: string }
  | { type: "check"; check: CheckResult }
  | { type: "done"; summary: ScoreSummary; durationMs: number; findings: FindingDraft[]; meta: { finalUrl?: string; vendors: string[] } }
  | { type: "error"; message: string };

export function QuickScan() {
  const { t } = useT();
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [done, setDone] = useState<Extract<Ev, { type: "done" }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || running) return;
    setRunning(true); setChecks([]); setDone(null); setError(null); setElapsed(0);
    const start = Date.now();
    timer.current = setInterval(() => setElapsed((Date.now() - start) / 1000), 100);
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Scan failed (${res.status})`);
      await readNdjson<Ev>(res, (ev) => {
        if (ev.type === "check") setChecks((c) => [...c, ev.check]);
        else if (ev.type === "done") setDone(ev);
        else if (ev.type === "error") setError(ev.message);
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (timer.current) clearInterval(timer.current);
      setElapsed((Date.now() - start) / 1000);
      setRunning(false);
    }
  }

  const visible = checks.filter((c) => c.status !== "info");
  return (
    <div className="w-full">
      <form onSubmit={scan} className="card mx-auto flex max-w-2xl flex-col gap-2 p-2 sm:flex-row" aria-label="Free AI quick scan">
        <div className="flex flex-1 items-center gap-2 px-3">
          <ScanLine size={18} className="shrink-0 text-brand-300" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("hero.scanPlaceholder")}
            className="w-full bg-transparent py-3 text-[15px] text-ink-100 outline-none placeholder:text-ink-400"
            inputMode="url"
            autoComplete="url"
            aria-label="URL to scan"
          />
        </div>
        <button className="btn-primary px-6 py-3" disabled={running || !url.trim()}>
          {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {running ? t("hero.scanning") : t("hero.scanCta")}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-ink-400">{t("hero.scanNote")}</p>

      {(running || done || error) && (
        <div className="card mx-auto mt-8 max-w-5xl animate-fade-up overflow-hidden text-start">
          <div className="flex items-center justify-between border-b border-fg/[0.06] px-5 py-3 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              {running ? <Loader2 size={15} className="animate-spin text-brand-300" /> : <ScanLine size={15} className="text-brand-300" />}
              Public-surface assessment {done?.meta.finalUrl && <span className="truncate font-normal text-ink-400">· {done.meta.finalUrl}</span>}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-ink-300"><Timer size={13} /> {elapsed.toFixed(1)}s</div>
          </div>

          {error && <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-300"><ShieldAlert size={16} /> {error}</div>}

          <div className="grid gap-0 md:grid-cols-[300px_1fr]">
            <div className="flex flex-col items-center gap-4 border-b border-fg/[0.06] p-6 md:border-b-0 md:border-e">
              {done ? (
                <>
                  <ScoreRing score={done.summary.awGti} size={150} sub="surface score" color={done.summary.gateFailed ? BAND_COLOR.critical : undefined} />
                  <div className="text-center">
                    <div className="font-semibold" style={{ color: BAND_COLOR[done.summary.ratingBand] }}>{done.summary.rating}</div>
                    <div className="mt-1 text-xs text-ink-400">Evidence coverage {done.summary.coverage}% of AW-GTI weight</div>
                  </div>
                  <div className="w-full space-y-2">
                    {done.summary.dimensions.filter((d) => d.score !== null).map((d) => (
                      <div key={d.key}>
                        <div className="mb-1 flex justify-between text-xs"><span className="text-ink-300">{d.label}</span><span className="font-semibold tabular-nums">{Math.round(d.score!)}</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-fg/[0.06]"><div className="h-full rounded-full" style={{ width: `${d.score}%`, background: scoreColor(d.score) }} /></div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center text-sm text-ink-300">
                  <div className="h-20 w-20 animate-pulse-ring rounded-full border border-brand-400/40 bg-brand-500/10" />
                  {visible.length} checks completed…
                </div>
              )}
            </div>
            <div className="max-h-[440px] overflow-y-auto p-2">
              {done && done.findings.length > 0 && (
                <div className="mb-2 rounded-xl border border-fg/[0.06] bg-fg/[0.02] p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Priority fixes</div>
                  <ul className="space-y-2">
                    {done.findings.slice(0, 4).map((f) => (
                      <li key={f.checkKey} className="flex items-start gap-2 text-sm">
                        <SeverityBadge severity={f.severity} />
                        <span className="flex-1">{f.title}<span className="block text-xs text-ink-400">{f.recommendation.actions[0]}</span></span>
                        {f.projectedUplift ? <span className="text-xs font-semibold text-emerald-300"><span dir="ltr">+{f.projectedUplift}</span></span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="divide-y divide-fg/[0.04]">
                {checks.map((c) => (
                  <li key={c.key} className="flex animate-fade-up items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="truncate text-xs text-ink-400">{c.measured}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {done && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-fg/[0.06] bg-brand-500/[0.06] px-5 py-4 sm:flex-row">
              <p className="text-sm text-ink-200">This scan covers the public web surface only. Add LLM red-teaming, fairness, governance and a verifiable credential in the full assessment.</p>
              <Link href="/login?mode=signup" className="btn-primary shrink-0">Run full assessment <ArrowRight size={15} className="rtl:rotate-180" /></Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";

export function EvaluationUpload({ systemId, kind }: { systemId: string; kind: "classification" | "agent_log" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(null); setOk(false);
    const fd = new FormData(e.currentTarget);
    fd.set("system_id", systemId); fd.set("kind", kind);
    const res = await fetch("/api/evaluations", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(j.error ?? "Upload failed"); return; }
    setOk(true);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  const isCls = kind === "classification";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="label" className="input" placeholder={isCls ? "Label, e.g. Credit model v3 — Q4 holdout" : "Label, e.g. Procurement agent — week 45"} />
      <input type="file" name="file" accept={isCls ? ".csv,text/csv" : ".json,.jsonl,.csv"} className="block w-full text-sm text-ink-300 file:me-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-200" />
      <textarea name="text" rows={4} className="input font-mono text-xs" placeholder={isCls ? "…or paste CSV: y_true,y_pred,y_prob,group" : "…or paste JSON array / JSONL / CSV of agent actions"} />
      {isCls ? (
        <details className="text-xs text-ink-400">
          <summary className="cursor-pointer">Column mapping (auto-detected if omitted)</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input name="y_true" className="input py-1.5 text-xs" placeholder="ground truth column" />
            <input name="y_pred" className="input py-1.5 text-xs" placeholder="prediction column" />
            <input name="y_prob" className="input py-1.5 text-xs" placeholder="probability column" />
            <input name="group" className="input py-1.5 text-xs" placeholder="protected group column" />
          </div>
        </details>
      ) : (
        <fieldset className="rounded-xl border border-fg/[0.06] p-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="kill_recorded" className="accent-brand-500" /> Record a kill-switch test with this log</label>
          <div className="mt-2 flex flex-wrap items-center gap-3 ps-6 text-xs text-ink-300">
            <label className="flex items-center gap-2"><input type="checkbox" name="kill_tested" className="accent-brand-500" /> Test executed successfully</label>
            <input name="kill_halt_ms" type="number" min={0} className="input w-44 py-1.5 text-xs" placeholder="Time to halt + revoke (ms)" />
          </div>
        </fieldset>
      )}
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      {ok && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">Evaluated and stored with a SHA-256 fingerprint of the input. It will be included in the next assessment.</div>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a href={`/api/samples/${isCls ? "classification.csv" : "agent-log.json"}`} className="btn-ghost text-xs"><Download size={13} /> Sample file</a>
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Evaluate</button>
      </div>
    </form>
  );
}

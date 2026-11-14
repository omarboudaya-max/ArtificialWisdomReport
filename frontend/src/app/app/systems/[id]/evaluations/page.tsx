import { Bot, Scale } from "lucide-react";
import { loadSystem } from "@/lib/systems";
import { EvaluationUpload } from "@/components/app/EvaluationUpload";
import type { AgentResults, ClassificationResults } from "@/lib/engine/evaluations";

export default async function Evaluations({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, canEdit } = await loadSystem(id);
  const { data: evals } = await supabase.from("evaluations").select("*").eq("system_id", id).order("created_at", { ascending: false }).limit(20);
  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2"><Scale size={18} className="text-brand-300" /><h2 className="font-semibold">Performance & fairness evaluation</h2></div>
            <p className="mb-4 text-sm text-ink-400">Upload labelled predictions. Computes accuracy, precision, recall, F1, ROC-AUC, Brier, ECE calibration and per-group selection rate, TPR/FPR, disparate impact, demographic parity and equalised odds.</p>
            <EvaluationUpload systemId={id} kind="classification" />
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2"><Bot size={18} className="text-cyan-glow" /><h2 className="font-semibold">Agentic AI assurance scorecard</h2></div>
            <p className="mb-4 text-sm text-ink-400">Upload agent action logs (fields: monitored, human_reviewed, flagged, reviewed_at, escalated, authorized, tool_misuse, policy_violation, success, recovered, delegated_to, delegation_safe, traced).</p>
            <EvaluationUpload systemId={id} kind="agent_log" />
          </div>
        </div>
      )}
      <div className="space-y-4">
        {(evals ?? []).map((e) => (
          <div key={e.id} className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><div className="font-semibold">{e.label || (e.kind === "classification" ? "Classification evaluation" : "Agent log evaluation")}</div>
                <div className="text-xs text-ink-400">{new Date(e.created_at).toLocaleString()} · input SHA-256 <span className="font-mono">{e.input_sha256.slice(0, 16)}…</span></div></div>
              <span className="chip border-white/10 text-ink-300">{e.kind === "classification" ? "fairness & performance" : "agentic"}</span>
            </div>
            {e.kind === "classification" ? <ClsView r={e.results as ClassificationResults} /> : <AgentView r={e.results as AgentResults} />}
          </div>
        ))}
        {!evals?.length && <p className="text-sm text-ink-400">No evaluations uploaded yet. Download a sample file to see the expected format.</p>}
      </div>
    </div>
  );
}

function Metric({ k, v }: { k: string; v: string | number | undefined | null }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-[11px] uppercase tracking-wider text-ink-400">{k}</div><div className="mt-0.5 font-mono text-lg font-semibold">{v ?? "—"}</div></div>;
}

function ClsView({ r }: { r: ClassificationResults }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <Metric k="n" v={r.n} /><Metric k="Accuracy" v={r.metrics.accuracy} /><Metric k="Precision" v={r.metrics.precision} /><Metric k="Recall" v={r.metrics.recall} />
        <Metric k="F1" v={r.metrics.f1} /><Metric k="ROC-AUC" v={r.metrics.rocAuc} /><Metric k="ECE" v={r.metrics.ece} /><Metric k="Brier" v={r.metrics.brier} />
      </div>
      {r.fairness && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric k="Disparate impact" v={r.fairness.disparateImpact} /><Metric k="Demographic parity Δ" v={r.fairness.demographicParityDiff} />
            <Metric k="Equal opportunity Δ" v={r.fairness.equalOpportunityDiff} /><Metric k="Equalised odds Δ" v={r.fairness.equalizedOddsDiff} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-400"><tr><th className="py-2">{r.groupColumn}</th><th>n</th><th>Selection rate</th><th>TPR</th><th>FPR</th><th>Accuracy</th></tr></thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {r.groups?.map((g) => <tr key={g.group}><td className="py-2 font-sans">{g.group}</td><td>{g.n}</td><td>{g.selectionRate}</td><td>{g.tpr}</td><td>{g.fpr}</td><td>{g.accuracy}</td></tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="text-xs text-ink-500">Confusion matrix — TP {r.confusion.tp} · FP {r.confusion.fp} · TN {r.confusion.tn} · FN {r.confusion.fn}</div>
    </div>
  );
}

function AgentView({ r }: { r: AgentResults }) {
  return (
    <div>
      <div className="mb-3 text-sm text-ink-300">{r.actions} actions · agents: {r.agents.join(", ")}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(r.metrics).map(([k, m]) => <Metric key={k} k={m.label} v={m.value == null ? "n/a" : `${m.value}${m.unit === "%" ? "%" : " " + m.unit}`} />)}
        {r.killSwitch && <Metric k="Kill switch" v={r.killSwitch.tested ? `tested · ${r.killSwitch.haltMs ?? "?"} ms` : "not tested"} />}
      </div>
    </div>
  );
}

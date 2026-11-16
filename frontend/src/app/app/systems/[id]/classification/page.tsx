import { loadSystem } from "@/lib/systems";
import { RISK_QUESTIONS, TIER_LABEL, classify, type RiskTier } from "@/lib/engine/eu-ai-act";
import { saveClassification } from "@/app/app/actions";
import { SubmitButton } from "@/components/app/SubmitButton";

const GROUPS = [
  { key: "prohibited", title: "Prohibited practices (Art. 5)", tone: "border-red-500/25" },
  { key: "high", title: "High-risk triggers (Art. 6, Annex I & III)", tone: "border-orange-500/25" },
  { key: "transparency", title: "Transparency obligations (Art. 50)", tone: "border-amber-500/25" },
  { key: "gpai", title: "General-purpose AI models (Art. 51–55)", tone: "border-brand-500/25" },
] as const;

const TIER_TONE: Record<RiskTier, string> = {
  prohibited: "from-red-500/25 text-red-200", high: "from-orange-500/25 text-orange-200", limited: "from-amber-500/20 text-amber-200",
  minimal: "from-emerald-500/20 text-emerald-200", gpai: "from-brand-500/25 text-brand-200", gpai_systemic: "from-red-500/20 text-red-200",
};

export default async function Classification({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { system, canEdit } = await loadSystem(id);
  const answers = (system.risk_answers ?? {}) as Record<string, boolean>;
  const result = system.risk_tier ? classify(answers) : null;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form action={saveClassification} className="space-y-4">
        <input type="hidden" name="id" value={id} />
        {GROUPS.map((g) => (
          <fieldset key={g.key} className={`card border-s-4 p-5 ${g.tone}`}>
            <legend className="sr-only">{g.title}</legend>
            <h2 className="mb-3 font-semibold">{g.title}</h2>
            <div className="space-y-2">
              {RISK_QUESTIONS.filter((q) => q.group === g.key).map((q) => (
                <label key={q.key} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm hover:bg-fg/[0.03]">
                  <input type="checkbox" name={`q_${q.key}`} defaultChecked={!!answers[q.key]} disabled={!canEdit} className="mt-0.5 h-4 w-4 accent-brand-500" />
                  <span className="flex-1 text-ink-200">{q.text}</span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-500">{q.ref}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {canEdit && <div className="flex justify-end"><SubmitButton>Classify system</SubmitButton></div>}
      </form>
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        {saved && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Classification saved and added to the audit trail.</div>}
        {result ? (
          <div className={`card bg-gradient-to-b ${TIER_TONE[result.tier]} to-transparent p-6`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Indicative classification</div>
            <div className="h-display mt-1 text-2xl font-bold text-fg">{TIER_LABEL[result.tier]}</div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Reasons</div>
            <ul className="mt-1 list-disc space-y-1 ps-5 text-sm text-ink-200">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Key obligations</div>
            <ul className="mt-1 list-disc space-y-1 ps-5 text-sm text-ink-200">{result.obligations.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        ) : (
          <div className="card p-6 text-sm text-ink-300">Select every statement that applies. The platform derives an indicative EU AI Act risk tier and lists the resulting obligations. A prohibited practice becomes a critical gate in every assessment.</div>
        )}
        <p className="text-xs text-ink-500">Indicative self-assessment based on Regulation (EU) 2024/1689. It is not legal advice; the Art. 6(3) derogation and role (provider / deployer) require legal review.</p>
      </div>
    </div>
  );
}

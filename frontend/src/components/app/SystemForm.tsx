import { JURISDICTIONS } from "@/lib/engine/compliance";
import { SubmitButton } from "./SubmitButton";

type Sys = { id?: string; name?: string; description?: string | null; system_type?: string; url?: string | null; endpoint_url?: string | null; provider?: string | null; model_name?: string | null; version?: string | null; use_case?: string | null; sector?: string | null; autonomy_level?: string | null; jurisdictions?: string[] };

export function SystemForm({ action, system = {}, submit }: { action: (f: FormData) => Promise<void>; system?: Sys; submit: string }) {
  const types = [
    ["llm_app", "LLM application / chatbot"], ["agent", "AI agent (tool use)"], ["rag", "RAG / knowledge assistant"], ["ml_model", "Predictive ML model"], ["website", "AI-powered website"], ["other", "Other"],
  ];
  return (
    <form action={action} className="card space-y-6 p-6 sm:p-8">
      {system.id && <input type="hidden" name="id" value={system.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="name">System name *</label><input id="name" name="name" required defaultValue={system.name} className="input" placeholder="Customer support assistant" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="description">Description & intended purpose</label><textarea id="description" name="description" rows={3} defaultValue={system.description ?? ""} className="input" placeholder="What it does, who uses it, what decisions it informs" /></div>
        <div><label className="label" htmlFor="system_type">System type</label>
          <select id="system_type" name="system_type" defaultValue={system.system_type ?? "llm_app"} className="input">{types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="autonomy_level">Autonomy level</label>
          <select id="autonomy_level" name="autonomy_level" defaultValue={system.autonomy_level ?? "assistive"} className="input">
            <option value="assistive">Assistive — human makes all decisions</option><option value="supervised">Supervised — acts with human approval</option><option value="autonomous">Autonomous — acts without approval</option>
          </select></div>
        <div><label className="label" htmlFor="url">Public URL</label><input id="url" name="url" defaultValue={system.url ?? ""} className="input" placeholder="https://assistant.example.com" /></div>
        <div><label className="label" htmlFor="endpoint_url">API endpoint (documentation only)</label><input id="endpoint_url" name="endpoint_url" defaultValue={system.endpoint_url ?? ""} className="input" placeholder="https://api.example.com/v1" /></div>
        <div><label className="label" htmlFor="provider">Model provider</label><input id="provider" name="provider" defaultValue={system.provider ?? ""} className="input" placeholder="OpenAI, Anthropic, Mistral, in-house…" /></div>
        <div><label className="label" htmlFor="model_name">Model</label><input id="model_name" name="model_name" defaultValue={system.model_name ?? ""} className="input" placeholder="e.g. gpt-4o, claude-sonnet, xgboost-v3" /></div>
        <div><label className="label" htmlFor="version">System version</label><input id="version" name="version" defaultValue={system.version ?? ""} className="input" placeholder="2.4.1" /></div>
        <div><label className="label" htmlFor="sector">Sector</label><input id="sector" name="sector" defaultValue={system.sector ?? ""} className="input" placeholder="Banking" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="use_case">Use case</label><input id="use_case" name="use_case" defaultValue={system.use_case ?? ""} className="input" placeholder="Answering customer account questions" /></div>
      </div>
      <fieldset>
        <legend className="label">Jurisdictions where it is offered or used</legend>
        <div className="flex flex-wrap gap-2">
          {JURISDICTIONS.map((j) => (
            <label key={j.code} className="flex cursor-pointer items-center gap-2 rounded-lg border border-fg/10 bg-fg/[0.02] px-3 py-2 text-sm has-[:checked]:border-brand-400/60 has-[:checked]:bg-brand-500/10">
              <input type="checkbox" name="jurisdictions" value={j.code} defaultChecked={system.jurisdictions?.includes(j.code)} className="accent-brand-500" /> {j.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end"><SubmitButton>{submit}</SubmitButton></div>
    </form>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Upload } from "lucide-react";

export function EvidenceUpload({ orgId, systems }: { orgId: string; systems: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg(null);
        const fd = new FormData(e.currentTarget);
        fd.set("org_id", orgId);
        const res = await fetch("/api/evidence", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return setMsg({ ok: false, text: j.error ?? "Upload failed" });
        setMsg({ ok: true, text: `Stored · SHA-256 ${String(j.sha256).slice(0, 20)}…` });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }}
    >
      <h2 className="font-semibold">Add evidence</h2>
      <input name="title" required className="input" placeholder="e.g. AI policy v2 signed by the board" />
      <div className="grid grid-cols-2 gap-2">
        <select name="kind" className="input">{["policy", "risk register", "impact assessment", "test report", "model card", "log export", "contract / DPA", "training record", "screenshot", "other"].map((k) => <option key={k}>{k}</option>)}</select>
        <select name="system_id" className="input"><option value="">Organization-wide</option>{systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>
      <input type="file" name="file" className="block w-full text-sm text-ink-300 file:me-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-200" />
      <input name="external_url" className="input" placeholder="…or link https://… (e.g. a public policy page)" />
      {msg && <div className={`rounded-lg border px-3 py-2 text-sm ${msg.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{msg.text}</div>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload to vault</button>
      <p className="flex items-start gap-1.5 text-[11px] text-ink-500"><ShieldCheck size={12} className="mt-0.5 shrink-0" /> Private bucket · SHA-256 fingerprint · every upload is written to the hash-chained audit trail. PDF, Office, CSV, JSON, text and images up to 4 MB.</p>
    </form>
  );
}

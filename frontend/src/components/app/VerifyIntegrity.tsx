"use client";
import { useState } from "react";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

export function VerifyIntegrity({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  return (
    <button className="btn-ghost px-2 py-1 text-xs" onClick={async () => {
      setState("busy");
      const r = await fetch(`/api/evidence/${id}?verify=1`).then((x) => x.json()).catch(() => ({ ok: false }));
      setState(r.ok ? "ok" : "bad");
    }}>
      {state === "busy" ? <Loader2 size={12} className="animate-spin" /> : state === "ok" ? <ShieldCheck size={12} className="text-emerald-400" /> : state === "bad" ? <ShieldX size={12} className="text-red-400" /> : <ShieldCheck size={12} />}
      {state === "ok" ? "Intact" : state === "bad" ? "Mismatch" : "Verify hash"}
    </button>
  );
}

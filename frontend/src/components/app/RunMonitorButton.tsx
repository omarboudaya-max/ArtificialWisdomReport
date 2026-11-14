"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

export function RunMonitorButton({ systemId }: { systemId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button className="btn-secondary py-1.5 text-xs" disabled={busy} onClick={async () => {
      setBusy(true);
      await fetch("/api/monitoring/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemId }) });
      setBusy(false);
      router.refresh();
    }}>{busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check now</button>
  );
}

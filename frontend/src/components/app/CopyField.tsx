"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <input readOnly value={value} aria-label={label} className="input min-w-0 flex-1 py-1.5 font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn-secondary py-1.5 text-xs" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

import { CheckCircle2, AlertTriangle, XCircle, CircleDashed, Info } from "lucide-react";

const STATUS = {
  pass: { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", Icon: CheckCircle2, label: "Pass" },
  warn: { cls: "border-amber-500/30 bg-amber-500/10 text-amber-300", Icon: AlertTriangle, label: "Warn" },
  fail: { cls: "border-red-500/30 bg-red-500/10 text-red-300", Icon: XCircle, label: "Fail" },
  untested: { cls: "border-white/10 bg-white/[0.03] text-ink-400", Icon: CircleDashed, label: "Untested" },
  info: { cls: "border-sky-500/25 bg-sky-500/10 text-sky-300", Icon: Info, label: "Info" },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS] ?? STATUS.info;
  return (
    <span className={`chip ${s.cls}`}>
      <s.Icon size={12} /> {s.label}
    </span>
  );
}

const SEV: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/15 text-red-300",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  info: "border-white/10 bg-white/[0.03] text-ink-400",
};
export function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`chip ${SEV[severity] ?? SEV.info}`}>{severity}</span>;
}

const TIER: Record<string, { label: string; cls: string }> = {
  automated_assessment: { label: "Automated assessment", cls: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  provisional: { label: "Provisional trust credential", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  reviewed: { label: "Independently reviewed", cls: "border-brand-400/40 bg-brand-500/15 text-brand-300" },
  independently_certified: { label: "Independently certified", cls: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
};
export const tierLabel = (t: string) => TIER[t]?.label ?? t;
export function TierBadge({ tier }: { tier: string }) {
  const t = TIER[tier] ?? TIER.automated_assessment;
  return <span className={`chip ${t.cls}`}>{t.label}</span>;
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-ink-400">{icon}</div>}
      <h3 className="h-display text-lg font-semibold">{title}</h3>
      {children && <div className="max-w-md text-sm text-ink-300">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">{eyebrow}</div>}
        <h1 className="h-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-ink-300">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

"use client";
import { CheckCircle2, AlertTriangle, XCircle, CircleDashed, Info } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { TKey } from "@/lib/i18n/dictionaries";

const STATUS = {
  pass: { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", Icon: CheckCircle2 },
  warn: { cls: "border-amber-500/30 bg-amber-500/10 text-amber-300", Icon: AlertTriangle },
  fail: { cls: "border-red-500/30 bg-red-500/10 text-red-300", Icon: XCircle },
  untested: { cls: "border-fg/10 bg-fg/[0.03] text-ink-400", Icon: CircleDashed },
  info: { cls: "border-sky-500/25 bg-sky-500/10 text-sky-300", Icon: Info },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const key = (status in STATUS ? status : "info") as keyof typeof STATUS;
  const s = STATUS[key];
  return (
    <span className={`chip ${s.cls}`}>
      <s.Icon size={12} /> {t(`status.${key}` as TKey)}
    </span>
  );
}

const SEV: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/15 text-red-300",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  info: "border-fg/10 bg-fg/[0.03] text-ink-400",
};
export function SeverityBadge({ severity }: { severity: string }) {
  const { t } = useT();
  const key = severity in SEV ? severity : "info";
  return <span className={`chip ${SEV[key]}`}>{t(`sev.${key}` as TKey)}</span>;
}

const TIER: Record<string, string> = {
  automated_assessment: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  provisional: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  reviewed: "border-brand-400/40 bg-brand-500/15 text-brand-300",
  independently_certified: "border-amber-400/40 bg-amber-400/10 text-amber-300",
};
const TIER_EN: Record<string, string> = {
  automated_assessment: "Automated assessment", provisional: "Provisional trust credential", reviewed: "Independently reviewed", independently_certified: "Independently certified",
};
export const tierLabel = (t: string) => TIER_EN[t] ?? t;
export function TierBadge({ tier }: { tier: string }) {
  const { t } = useT();
  const key = tier in TIER ? tier : "automated_assessment";
  return <span className={`chip ${TIER[key]}`}>{t(`tier.${key}` as TKey)}</span>;
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fg/10 bg-fg/[0.03] text-ink-400">{icon}</div>}
      <h3 className="h-display text-lg font-semibold">{title}</h3>
      {children && <div className="max-w-md text-sm text-ink-300">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">{eyebrow}</div>}
        <h1 className="h-display text-2xl font-bold text-ink-100 sm:text-[1.9rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-300">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

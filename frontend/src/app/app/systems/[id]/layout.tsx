import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { loadSystem } from "@/lib/systems";
import { getT } from "@/lib/i18n/server";
import { Tabs } from "@/components/app/Tabs";
import { TIER_LABEL, type RiskTier } from "@/lib/engine/eu-ai-act";

export default async function SystemLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ system, canEdit }, { t }] = await Promise.all([loadSystem(id), getT()]);
  const base = `/app/systems/${id}`;
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/app/systems" className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300 hover:text-fg">{t("app.systems")}</Link>
          <h1 className="h-display mt-1 text-2xl font-bold sm:text-3xl">{system.name}</h1>
          <p className="mt-1 text-sm text-ink-400">
            {system.system_type.replace("_", " ")} · {system.autonomy_level} {system.version && `· v${system.version}`} {system.risk_tier && `· ${TIER_LABEL[system.risk_tier as RiskTier]}`}
          </p>
        </div>
        {canEdit && <Link href={`/app/assess?system=${id}`} className="btn-primary"><PlayCircle size={16} /> {t("act.run30")}</Link>}
      </div>
      <Tabs tabs={[
        { href: base, label: t("tab.overview"), exact: true },
        { href: `${base}/classification`, label: t("tab.risk") },
        { href: `${base}/governance`, label: t("tab.governance") },
        { href: `${base}/evaluations`, label: t("tab.evaluations") },
        { href: `${base}/incidents`, label: t("tab.incidents") },
        ...(canEdit ? [{ href: `${base}/edit`, label: t("tab.edit") }] : []),
      ]} />
      {children}
    </>
  );
}

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { loadSystem } from "@/lib/systems";
import { Tabs } from "@/components/app/Tabs";
import { TIER_LABEL, type RiskTier } from "@/lib/engine/eu-ai-act";

export default async function SystemLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { system, canEdit } = await loadSystem(id);
  const base = `/app/systems/${id}`;
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/app/systems" className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300 hover:text-white">AI systems</Link>
          <h1 className="h-display mt-1 text-2xl font-bold sm:text-3xl">{system.name}</h1>
          <p className="mt-1 text-sm text-ink-400">
            {system.system_type.replace("_", " ")} · {system.autonomy_level} {system.version && `· v${system.version}`} {system.risk_tier && `· ${TIER_LABEL[system.risk_tier as RiskTier]}`}
          </p>
        </div>
        {canEdit && <Link href={`/app/assess?system=${id}`} className="btn-primary"><PlayCircle size={16} /> Run 30-second assessment</Link>}
      </div>
      <Tabs tabs={[
        { href: base, label: "Overview", exact: true },
        { href: `${base}/classification`, label: "EU AI Act risk" },
        { href: `${base}/governance`, label: "Governance controls" },
        { href: `${base}/evaluations`, label: "Model & agent evaluations" },
        { href: `${base}/incidents`, label: "Incidents" },
        ...(canEdit ? [{ href: `${base}/edit`, label: "Edit profile" }] : []),
      ]} />
      {children}
    </>
  );
}

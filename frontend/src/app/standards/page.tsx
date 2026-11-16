import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FRAMEWORKS } from "@/lib/engine/compliance";

export const metadata = { title: "Standards & regulatory alignment" };

const STAKEHOLDERS = [
  ["European Union", "European Commission AI Office · EDPB · ENISA · EDPS · EU Agency for Fundamental Rights"],
  ["Standards", "ISO/IEC JTC 1/SC 42 (ISO/IEC 42001, 42006, 23894, 22989, 5338) · NIST AI RMF · IEEE 7000 series · IETF"],
  ["Intergovernmental", "UNESCO · OECD.AI · Council of Europe · United Nations (Global Digital Compact) · GPAI · International AI Safety Report & AI Safety Institutes network"],
  ["Tunisia & Africa", "INPDP · ANCS · Ministry of Communication Technologies · INNORPI · African Union Continental AI Strategy · Smart Africa · AFRINIC"],
];

export default function Standards() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">International Standards & Regulatory Alignment Programme</div>
        <h1 className="h-display mt-2 text-4xl font-bold">A version-controlled compliance library</h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-300">Artificial Wisdom builds its methodology on recognised law, standards and frameworks rather than an isolated definition of trustworthy AI. Each instrument keeps its legal status, jurisdiction and effective dates.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FRAMEWORKS.map((f) => (
            <section key={f.key} id={f.key} className="card scroll-mt-24 p-6">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold">{f.name}</h2><div className="mt-1 text-xs text-ink-400">{f.jurisdiction} · {f.body}</div></div>
                <a href={f.url} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 px-2" aria-label={`Official source for ${f.short}`}><ExternalLink size={15} /></a>
              </div>
              <div className="mt-3 flex flex-wrap gap-2"><span className="chip border-brand-400/30 bg-brand-500/10 text-brand-200 normal-case tracking-normal">{f.status}</span><span className="chip border-fg/10 text-ink-300 normal-case tracking-normal">{f.effective}</span></div>
              {f.note && <p className="mt-3 text-sm text-amber-200/80">{f.note}</p>}
              {f.requirements.length > 0 && <p className="mt-3 text-xs text-ink-400">{f.requirements.length} requirements mapped: {f.requirements.map((r) => r.id).join(" · ")}</p>}
            </section>
          ))}
        </div>
        <h2 className="h-display mt-16 text-2xl font-semibold">Stakeholder engagement map</h2>
        <p className="mt-2 text-sm text-ink-400">Targets for standards alignment, technical engagement or institutional dialogue. Inclusion does not imply any existing partnership, endorsement or formal recognition.</p>
        <div className="card mt-4 divide-y divide-fg/[0.05]">{STAKEHOLDERS.map(([k, v]) => <div key={k} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[180px_1fr]"><b>{k}</b><span className="text-ink-300">{v}</span></div>)}</div>
        <div className="card mt-8 p-6 text-sm text-ink-300">
          <b className="text-ink-100">Certification pathway.</b> ISO/IEC 42001 specifies AI management systems; ISO/IEC 42006 specifies requirements for bodies that audit and certify them (supplementing ISO/IEC 17021-1); ISO/IEC 17065 applies where a product, process or service certification scheme is established. Artificial Wisdom separates its technology platform (automated assessment, monitoring, evidence) from independent assurance and certification decisions, and does not market automated results as accredited certification.
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

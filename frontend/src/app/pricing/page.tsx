import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Pricing" };

const PLANS = [
  { name: "Starter", price: "$49–99", per: "per month", features: ["Public-surface scans", "LLM probe suite for 1 system", "AW-GTI & initial risk report", "PDF reports"], cta: "Start free" },
  { name: "Professional", price: "$299–499", per: "per month", features: ["Up to 10 AI systems", "Full LLM red-team & fairness probes", "Compliance gap analysis (13 instruments)", "Continuous monitoring & alerts", "Evidence vault"], cta: "Start free", featured: true },
  { name: "Enterprise", price: "$1,500–5,000+", per: "per month", features: ["Unlimited systems", "Agentic AI assurance scorecard", "Executive governance dashboard", "Auditor workspaces & reviews", "Webhook integrations, SSO on request"], cta: "Contact us" },
  { name: "Institutional / Government", price: "Custom", per: "annual or project-based", features: ["Dedicated environment", "Customised evaluation frameworks", "Arabic / African language benchmarks", "Research & technical collaboration"], cta: "Contact us" },
];

export default async function Pricing() {
  const { t } = await getT();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="h-display text-center text-4xl font-bold">{t("pricing.title")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-300">{t("pricing.subtitle")}</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`card flex flex-col p-6 ${p.featured ? "border-brand-400/50 shadow-[0_0_60px_-20px_rgb(99_102_241/0.6)]" : ""}`}>
              {p.featured && <div className="chip mb-3 w-fit border-brand-400/40 bg-brand-500/20 text-brand-200">{t("pricing.popular")}</div>}
              <h2 className="h-display text-xl font-semibold">{p.name}</h2>
              <div dir="ltr" className="h-display mt-3 text-3xl font-bold">{p.price === "Custom" ? t("pricing.custom") : p.price}</div>
              <div className="text-xs text-ink-400">{p.per === "per month" ? t("pricing.perMonth") : t("pricing.annual")}</div>
              <ul className="mt-6 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" /> {f}</li>)}</ul>
              <Link href={p.cta !== "Start free" && process.env.NEXT_PUBLIC_CONTACT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}` : "/login?mode=signup"} className={p.featured ? "btn-primary mt-6" : "btn-secondary mt-6"}>{p.cta === "Start free" ? t("nav.start") : t("pricing.contact")}</Link>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-ink-400">{t("pricing.extra")}</p>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import {
  Activity, ArrowRight, Bot, BrainCircuit, FileCheck2, Gauge, Globe2, Landmark, Languages, Radar as RadarIcon, Scale, ScanSearch, ShieldCheck, Sparkles, Workflow,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QuickScan } from "@/components/site/QuickScan";
import { getT } from "@/lib/i18n/server";
import { DIMENSIONS } from "@/lib/engine/types";
import { FRAMEWORKS } from "@/lib/engine/compliance";

export default async function Home() {
  const { t } = await getT();
  const modules = [
    { n: "01", icon: ScanSearch, title: t("m1.title"), desc: t("m1.desc") },
    { n: "02", icon: Gauge, title: t("m2.title"), desc: t("m2.desc") },
    { n: "03", icon: ShieldCheck, title: t("m3.title"), desc: t("m3.desc") },
    { n: "04", icon: Scale, title: t("m4.title"), desc: t("m4.desc") },
    { n: "05", icon: Landmark, title: t("m5.title"), desc: t("m5.desc") },
    { n: "06", icon: FileCheck2, title: t("m6.title"), desc: t("m6.desc") },
    { n: "07", icon: Activity, title: t("m7.title"), desc: t("m7.desc") },
  ];
  const steps = [
    { icon: Workflow, title: t("how.s1"), desc: t("how.s1d") },
    { icon: Sparkles, title: t("how.s2"), desc: t("how.s2d") },
    { icon: Gauge, title: t("how.s3"), desc: t("how.s3d") },
    { icon: FileCheck2, title: t("how.s4"), desc: t("how.s4d") },
  ];
  const agentMetrics = ["Monitoring coverage", "Human oversight coverage", "Review latency", "Escalation rate", "Unauthorised action rate", "Tool misuse rate", "Policy violation rate", "Task completion reliability", "Recovery rate", "Delegation integrity", "Action traceability", "Kill-switch effectiveness"];

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow shadow-[0_0_10px_#22d3ee]" /> {t("hero.badge")}
            </div>
            <h1 className="h-display mx-auto max-w-4xl text-4xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              {t("hero.title1")} <span className="text-gradient">{t("hero.title2")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-ink-300 sm:text-lg">{t("hero.subtitle")}</p>
            <div className="mt-10">
              <QuickScan />
            </div>
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["70+", t("stats.checks")],
                [String(FRAMEWORKS.filter((f) => f.requirements.length).length), t("stats.frameworks")],
                ["4", t("stats.languages")],
                ["≤30", t("stats.seconds")],
              ].map(([v, l]) => (
                <div key={l} className="card px-4 py-5">
                  <div dir="ltr" className="h-display text-3xl font-bold text-gradient">{v}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MODULES */}
        <section id="platform" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="h-display text-3xl font-bold sm:text-4xl">{t("modules.title")}</h2>
            <p className="mt-3 text-ink-300">{t("modules.subtitle")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m) => (
              <div key={m.n} className="card card-hover group p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-400/20 bg-brand-500/10 text-brand-300 transition group-hover:scale-105"><m.icon size={20} /></div>
                  <span className="font-mono text-xs text-ink-500">{m.n}</span>
                </div>
                <h3 className="h-display text-lg font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{m.desc}</p>
              </div>
            ))}
            <div className="card relative overflow-hidden p-6 sm:col-span-2 lg:col-span-1">
              <div className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="relative">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-glow">AW-GTI</div>
                <div className="h-display mt-2 text-xl font-semibold">Evidence-based, explainable, versioned and independently reviewable.</div>
                <Link href="/methodology" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-white">Read the methodology <ArrowRight size={14} className="rtl:rotate-180" /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section className="border-y border-white/[0.05] bg-ink-900/40">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <h2 className="h-display mb-12 text-center text-3xl font-bold sm:text-4xl">{t("how.title")}</h2>
            <div className="grid gap-6 md:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.title} className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 font-bold text-white">{i + 1}</div>
                    <s.icon size={18} className="text-ink-400" />
                  </div>
                  <h3 className="h-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-300">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GTI */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Proprietary scoring</div>
            <h2 className="h-display mt-2 text-3xl font-bold sm:text-4xl">{t("gti.title")}</h2>
            <p className="mt-3 text-ink-300">{t("gti.subtitle")}</p>
            <ul className="mt-6 space-y-3 text-sm text-ink-200">
              <li className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" /> Critical gates — exposed secrets, prompt-injection secret leakage, PII disclosure, dangerous-capability compliance, unauthorised tool execution, untested kill switch, prohibited practice — override the rating.</li>
              <li className="flex gap-3"><RadarIcon size={18} className="mt-0.5 shrink-0 text-cyan-glow" /> Coverage is always reported: untested dimensions are shown as untested, never assumed.</li>
              <li className="flex gap-3"><BrainCircuit size={18} className="mt-0.5 shrink-0 text-brand-300" /> Technical score, governance score, compliance status and assurance status are reported separately.</li>
            </ul>
          </div>
          <div className="card p-6">
            <div className="space-y-4">
              {DIMENSIONS.map((d) => (
                <div key={d.key}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{d.label}</span><span className="font-mono text-brand-300">{d.weight}%</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-glow" style={{ width: `${d.weight * 4}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-ink-400">Weights are proposed starting assumptions (v1.0), to be validated through expert review and pilot audits — not an established international standard.</p>
          </div>
        </section>

        {/* AGENTIC */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="card relative overflow-hidden p-8 sm:p-12">
            <div className="absolute -start-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr]">
              <div>
                <Bot className="text-cyan-glow" size={28} />
                <h2 className="h-display mt-4 text-3xl font-bold">Agentic AI Assurance Scorecard</h2>
                <p className="mt-3 text-ink-300">It is no longer enough to grade a chatbot&apos;s answers. Upload agent action logs and measure what agents actually do — which tools they touch, who reviews them, and whether you can stop them.</p>
                <Link href="/login?mode=signup" className="btn-primary mt-6">Assess an agent <ArrowRight size={15} className="rtl:rotate-180" /></Link>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {agentMetrics.map((m) => (
                  <div key={m} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm font-medium text-ink-200">{m}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ARABIC / AFRICA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-6 md:col-span-2">
              <Languages className="text-brand-300" />
              <h3 className="h-display mt-3 text-xl font-semibold">Arabic & African AI fairness, built in</h3>
              <p className="mt-2 text-sm text-ink-300">Every LLM assessment checks accuracy and language parity across English, French, Modern Standard Arabic and Tunisian Darija — because most global evaluations ignore regional languages, dialects and code-switching.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm" dir="auto">
                {["What is the capital of Japan?", "Quelle est la capitale du Japon ?", "ما هي عاصمة اليابان؟", "شنية عاصمة اليابان؟"].map((q) => (
                  <span key={q} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">{q}</span>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <Globe2 className="text-cyan-glow" />
              <h3 className="h-display mt-3 text-xl font-semibold">Global compliance library</h3>
              <p className="mt-2 text-sm text-ink-300">Binding law, voluntary standards and guidance kept distinct, applicability by jurisdiction and role.</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {FRAMEWORKS.map((f) => (
                  <span key={f.key} className="chip border-white/10 bg-white/[0.03] text-ink-300 normal-case tracking-normal">{f.short}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TIERS */}
        <section className="border-t border-white/[0.05] bg-ink-900/40">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <h2 className="h-display mb-10 text-center text-3xl font-bold sm:text-4xl">{t("tiers.title")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { t: t("tiers.t1"), d: t("tiers.t1d"), c: "from-sky-500/20" },
                { t: t("tiers.t2"), d: t("tiers.t2d"), c: "from-emerald-500/20" },
                { t: t("tiers.t3"), d: t("tiers.t3d"), c: "from-brand-500/25" },
              ].map((x, i) => (
                <div key={x.t} className={`card bg-gradient-to-b ${x.c} to-transparent p-6`}>
                  <div className="font-mono text-xs text-ink-400">TIER {i + 1}</div>
                  <h3 className="h-display mt-2 text-xl font-semibold">{x.t}</h3>
                  <p className="mt-2 text-sm text-ink-300">{x.d}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-ink-400">{t("tiers.note")}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
          <h2 className="h-display text-3xl font-bold sm:text-5xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-300">{t("cta.subtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login?mode=signup" className="btn-primary px-6 py-3">{t("nav.start")} <ArrowRight size={16} className="rtl:rotate-180" /></Link>
            <Link href="/methodology" className="btn-secondary px-6 py-3">{t("nav.methodology")}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import { ShieldAlert, ShieldCheck, TrendingUp } from "lucide-react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Radar } from "@/components/ui/Radar";
import { SeverityBadge, TierBadge } from "@/components/ui/Badges";
import { getT } from "@/lib/i18n/server";
import type { TKey } from "@/lib/i18n/dictionaries";

/** Static, clearly-labelled illustrative report used on the landing page. */
export async function ProductPreview() {
  const { t, locale } = await getT();
  const L = (en: string, fr: string, ar: string) => (locale === "ar" ? ar : locale === "fr" ? fr : en);
  const dims = { safety_security: 64, reliability: 86, ethics_fairness: 71, governance: 78, privacy: 82, transparency: 88, sustainability: 74 };
  const findings: { sev: string; title: string; up: number }[] = [
    { sev: "high", title: L("Indirect prompt-injection resistance", "Résistance à l'injection de prompt indirecte", "مقاومة حقن الأوامر غير المباشر"), up: 3.4 },
    { sev: "medium", title: L("Counterfactual fairness (name / gender swap)", "Équité contrefactuelle (nom / genre)", "الإنصاف المضاد للواقع (تبديل الاسم / الجنس)"), up: 2.1 },
    { sev: "medium", title: L("Arabic & dialect language parity", "Parité arabe & dialectes", "التكافؤ اللغوي للعربية ولهجاتها"), up: 1.6 },
  ];
  const gates = [["sec.exposed_secrets", true], ["llm.pii_leakage", true], ["llm.tool_misuse", true]] as const;
  const gateNames: Record<string, string> = {
    "sec.exposed_secrets": L("Exposed AI credentials", "Identifiants IA exposés", "مفاتيح ذكاء اصطناعي مكشوفة"),
    "llm.pii_leakage": L("Sensitive data disclosure", "Divulgation de données sensibles", "إفشاء البيانات الحساسة"),
    "llm.tool_misuse": L("Unauthorised tool execution", "Exécution d'outil non autorisée", "تنفيذ أدوات غير مصرّح به"),
  };
  return (
    <section className="mx-auto max-w-7xl overflow-x-clip px-4 pb-24 sm:px-6">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <h2 className="h-display text-3xl font-bold sm:text-4xl">{t("preview.title")}</h2>
        <p className="mt-3 text-ink-300">{t("preview.subtitle")}</p>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-gradient-to-b from-brand-500/15 via-cyan-500/5 to-transparent blur-2xl" />
        <div className="card relative overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-fg/[0.06] px-5 py-3">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="truncate text-xs text-ink-400">{t("rep.title")} · {L("Customer Support Assistant", "Assistant service client", "مساعد خدمة العملاء")}</div>
            <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300 normal-case tracking-normal">{t("common.illustrative")}</span>
          </div>
          <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr_1.2fr]">
            <div className="flex flex-col items-center justify-center gap-3 border-b border-fg/[0.06] p-8 lg:border-b-0 lg:border-e">
              <ScoreRing score={77.4} size={170} sub="AW-GTI" />
              <div className="text-center font-semibold text-yellow-300">{t("rating.developing")}</div>
              <TierBadge tier="provisional" />
            </div>
            <div className="flex items-center justify-center border-b border-fg/[0.06] p-6 lg:border-b-0 lg:border-e"><Radar values={dims} size={300} /></div>
            <div className="space-y-5 p-6">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{t("preview.findings")}</div>
                <ul className="space-y-2">
                  {findings.map((f) => (
                    <li key={f.title} className="flex items-center gap-2 rounded-xl border border-fg/[0.06] bg-fg/[0.02] px-3 py-2.5 text-sm">
                      <SeverityBadge severity={f.sev} />
                      <span className="flex-1 truncate">{f.title}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300"><TrendingUp size={12} /><span dir="ltr">+{f.up}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">{t("preview.gates")}</div>
                <ul className="space-y-1.5 text-sm">
                  {gates.map(([k, ok]) => (
                    <li key={k} className="flex items-center gap-2">{ok ? <ShieldCheck size={15} className="text-emerald-400" /> : <ShieldAlert size={15} className="text-red-400" />}<span>{gateNames[k]}</span></li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {(["dimShort.safety_security", "dimShort.ethics_fairness", "dimShort.governance"] as TKey[]).map((k, i) => (
                  <div key={k} className="rounded-xl border border-fg/[0.06] p-2.5"><div className="text-[11px] text-ink-400">{t(k)}</div><div className="h-display text-lg font-bold">{[64, 71, 78][i]}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

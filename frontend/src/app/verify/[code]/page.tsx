import Link from "next/link";
import { BadgeCheck, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getPublicCredential } from "@/lib/credentials";
import { getT } from "@/lib/i18n/server";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Radar } from "@/components/ui/Radar";
import { TierBadge } from "@/components/ui/Badges";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: `Credential ${code}`, robots: { index: false } };
}

export default async function VerifyCode({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [c, { t, date, rating }] = await Promise.all([getPublicCredential(decodeURIComponent(code).toUpperCase()), getT()]);
  const valid = c?.status === "active";
  const modules = (c?.scope.modules ?? {}) as Record<string, unknown>;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14">
        {!c ? (
          <div className="card p-10 text-center"><XCircle size={44} className="mx-auto text-red-400" /><h1 className="h-display mt-4 text-2xl font-bold">{t("verify.notFound")}</h1><p className="mt-2 text-sm text-ink-300">No Artificial Wisdom record matches <span className="font-mono">{code}</span>. Treat any badge displaying this code as unverified.</p><Link href="/verify" className="btn-secondary mt-6">Try another code</Link></div>
        ) : (
          <div className="space-y-5">
            <div className={`card flex flex-wrap items-center gap-4 p-5 ${valid ? "border-emerald-500/30" : "border-red-500/30"}`}>
              {valid ? <ShieldCheck size={32} className="text-emerald-400" /> : <ShieldAlert size={32} className="text-red-400" />}
              <div className="flex-1">
                <div className="h-display text-xl font-bold">{valid ? t("verify.valid") : `${t("status.fail")} · ${c.status}`}</div>
                <div className="text-sm text-ink-300">{valid ? `Issued by the Artificial Wisdom platform on ${date(c.issued_at)}, valid until ${date(c.expires_at)}.` : c.revoked_reason ?? "This credential is no longer valid."}</div>
              </div>
              <TierBadge tier={c.tier} />
            </div>
            <div className="card grid gap-6 p-6 md:grid-cols-[auto_1fr]">
              <ScoreRing score={c.aw_gti} size={160} sub="AW-GTI" />
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-400">{t("verify.system")}</div>
                <h1 className="h-display text-2xl font-bold">{c.system}</h1>
                <div className="text-sm text-ink-300">{c.organization}{c.scope.version ? ` · v${c.scope.version}` : ""}</div>
                <div className="mt-2 font-semibold">{rating(c.rating)}</div>
                <dl className="mt-4 grid gap-1.5 text-sm">
                  {[["Credential", c.code], ["Methodology", c.methodology], ["Evidence coverage", `${c.scope.coverage ?? "—"}%`], ["Modules", Object.entries(modules).filter(([, v]) => v).map(([k]) => k.replace("_", " ")).join(", ")], ["Public URL", c.scope.url as string], ["Report SHA-256", c.report_sha256]].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[140px_1fr] gap-2"><dt className="text-ink-400">{k}</dt><dd className="break-all font-mono text-xs">{v || "—"}</dd></div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="card flex items-center justify-center p-4"><Radar values={c.dimension_scores} size={300} /></div>
              <div className="card p-6">
                <h2 className="mb-3 font-semibold">Critical gates</h2>
                <ul className="space-y-1.5 text-sm">{c.gates.map((g) => <li key={g.name} className="flex items-center gap-2">{g.passed ? <ShieldCheck size={15} className="text-emerald-400" /> : <ShieldAlert size={15} className="text-red-400" />}{g.name}</li>)}{!c.gates.length && <li className="text-ink-400">None in scope</li>}</ul>
                <h2 className="mb-2 mt-6 font-semibold">{t("verify.meaning")}</h2>
                <p className="text-sm text-ink-300">
                  {c.tier === "reviewed" ? "The automated assessment was examined and approved by an independent reviewer who declared no conflict of interest." : c.tier === "provisional" ? "The system met the automated criteria (AW-GTI ≥ 70, coverage ≥ 50%, no failed critical gate) within the stated scope." : "An automated technical assessment was completed. No trust threshold is asserted."}{" "}
                  It is not an accredited certification. <Link href="/methodology" className="text-brand-300">Methodology</Link>
                </p>
              </div>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500"><BadgeCheck size={13} /> {t("verify.live")}</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

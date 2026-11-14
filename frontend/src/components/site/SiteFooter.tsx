import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink-300">{t("footer.tagline")}</p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-400">
            Artificial Wisdom provides automated AI assurance assessments. Automated results and provisional credentials are not accredited certifications. References to standards bodies and regulators indicate alignment targets, not endorsements or partnerships.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Platform</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><Link href="/#platform" className="hover:text-white">Modules</Link></li>
            <li><Link href="/methodology" className="hover:text-white">AW-GTI methodology</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/verify" className="hover:text-white">Verify a credential</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Alignment</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><Link href="/standards#eu_ai_act" className="hover:text-white">EU AI Act</Link></li>
            <li><Link href="/standards#iso42001" className="hover:text-white">ISO/IEC 42001 & 42006</Link></li>
            <li><Link href="/standards#nist_ai_rmf" className="hover:text-white">NIST AI RMF</Link></li>
            <li><Link href="/standards#tn_2004_63" className="hover:text-white">Tunisia & Africa</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.05] py-5 text-center text-xs text-ink-400">© {new Date().getFullYear()} Artificial Wisdom. {t("footer.rights")}</div>
    </footer>
  );
}

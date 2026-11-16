import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="border-t border-fg/[0.06] bg-ink-900/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ink-300">{t("footer.tagline")}</p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-400">{t("footer.disclaimer")}</p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{t("footer.platform")}</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><Link href="/#platform" className="hover:text-ink-100">{t("footer.modules")}</Link></li>
            <li><Link href="/methodology" className="hover:text-ink-100">{t("footer.methodology")}</Link></li>
            <li><Link href="/pricing" className="hover:text-ink-100">{t("nav.pricing")}</Link></li>
            <li><Link href="/verify" className="hover:text-ink-100">{t("footer.verify")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">{t("footer.alignment")}</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><Link href="/standards#eu_ai_act" className="hover:text-ink-100">EU AI Act</Link></li>
            <li><Link href="/standards#iso42001" className="hover:text-ink-100">ISO/IEC 42001 &amp; 42006</Link></li>
            <li><Link href="/standards#nist_ai_rmf" className="hover:text-ink-100">NIST AI RMF</Link></li>
            <li><Link href="/standards#tn_2004_63" className="hover:text-ink-100">Tunisia &amp; Africa</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-fg/[0.05] py-5 text-center text-xs text-ink-400">© {new Date().getFullYear()} Artificial Wisdom. {t("footer.rights")}</div>
    </footer>
  );
}

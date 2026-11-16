import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getT, getTheme } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const [{ t }, theme] = await Promise.all([getT(), getTheme()]);
  const user = isSupabaseConfigured() ? (await getSession()).user : null;
  const links = [
    { href: "/#platform", label: t("nav.platform") },
    { href: "/methodology", label: t("nav.methodology") },
    { href: "/standards", label: t("nav.standards") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/verify", label: t("nav.verify") },
  ];
  return (
    <header className="glass-header sticky top-0 z-40 border-b border-fg/[0.06]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-300 transition hover:bg-fg/[0.04] hover:text-ink-100">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <LocaleSwitcher />
            <ThemeToggle initial={theme} compact />
          </div>
          {user ? (
            <Link href="/app" className="btn-primary">{t("nav.dashboard")}</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">{t("nav.signin")}</Link>
              <Link href="/login?mode=signup" className="btn-primary">{t("nav.start")}</Link>
            </>
          )}
          <MobileNav links={links} theme={theme} signInLabel={t("nav.signin")} />
        </div>
      </div>
    </header>
  );
}

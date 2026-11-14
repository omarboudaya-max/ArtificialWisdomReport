"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity, BadgeCheck, BookOpen, Boxes, ClipboardCheck, FileLock2, Gavel, LayoutDashboard, ListChecks, Menu, PlayCircle, ScrollText, Settings, UserCheck, X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useT } from "@/lib/i18n/client";
import type { TKey } from "@/lib/i18n/dictionaries";

const NAV: { href: string; key: TKey; icon: React.ComponentType<{ size?: number }>; exact?: boolean }[] = [
  { href: "/app", key: "app.overview", icon: LayoutDashboard, exact: true },
  { href: "/app/systems", key: "app.systems", icon: Boxes },
  { href: "/app/assess", key: "app.newAssessment", icon: PlayCircle },
  { href: "/app/findings", key: "app.findings", icon: ListChecks },
  { href: "/app/compliance", key: "app.compliance", icon: Gavel },
  { href: "/app/evidence", key: "app.evidence", icon: FileLock2 },
  { href: "/app/monitoring", key: "app.monitoring", icon: Activity },
  { href: "/app/credentials", key: "app.credentials", icon: BadgeCheck },
  { href: "/app/reviews", key: "app.reviews", icon: UserCheck },
  { href: "/app/audit-log", key: "app.auditLog", icon: ScrollText },
  { href: "/app/settings", key: "app.settings", icon: Settings },
];

export function Sidebar({ orgs, orgId, role, email, alerts }: { orgs: { id: string; name: string; role: string }[]; orgId: string; role: string; email: string; alerts: number }) {
  const path = usePathname();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo href="/app" />
        <button className="btn-ghost px-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <form action="/app/switch-org" method="post" className="px-3 pb-3">
        <select
          name="org_id"
          defaultValue={orgId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="input py-2 text-[13px] font-semibold"
          aria-label="Organization"
        >
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.role}</option>)}
        </select>
      </form>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((n) => {
          const active = n.exact ? path === n.href : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgb(129_140_248/0.25)]" : "text-ink-300 hover:bg-white/[0.04] hover:text-ink-100"}`}>
              <n.icon size={17} />
              <span className="flex-1">{t(n.key)}</span>
              {n.href === "/app/monitoring" && alerts > 0 && <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-300">{alerts}</span>}
            </Link>
          );
        })}
        <div className="my-3 border-t border-white/[0.05]" />
        <Link href="/methodology" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-400 hover:text-ink-100"><BookOpen size={17} /> {t("app.methodology")}</Link>
        <Link href="/standards" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-400 hover:text-ink-100"><ClipboardCheck size={17} /> Standards library</Link>
      </nav>
      <div className="border-t border-white/[0.06] p-4">
        <div className="truncate text-xs text-ink-300">{email}</div>
        <div className="mb-3 text-[11px] uppercase tracking-wider text-ink-500">{role}</div>
        <form action="/auth/signout" method="post"><button className="btn-secondary w-full py-2 text-xs">{t("app.signout")}</button></form>
      </div>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-ink-950/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo href="/app" />
        <button className="btn-ghost px-2" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
      </div>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-white/[0.06] bg-ink-950/80 backdrop-blur-xl lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 border-e border-white/10 bg-ink-950">{content}</aside>
        </div>
      )}
    </>
  );
}

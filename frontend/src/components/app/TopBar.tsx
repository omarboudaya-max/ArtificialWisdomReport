import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import type { Theme } from "@/lib/i18n/server";

export function TopBar({ orgName, theme, canEdit, runLabel }: { orgName: string; theme: Theme; canEdit: boolean; runLabel: string }) {
  return (
    <div className="glass-header sticky top-0 z-30 hidden h-14 items-center justify-between gap-4 border-b border-fg/[0.06] px-6 lg:flex lg:px-10">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.7)]" />
        <span className="truncate font-semibold text-ink-100">{orgName}</span>
      </div>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle initial={theme} />
        {canEdit && <Link href="/app/assess" className="btn-primary py-2"><PlayCircle size={15} /> {runLabel}</Link>}
      </div>
    </div>
  );
}

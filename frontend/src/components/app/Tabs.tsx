"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Tabs({ tabs }: { tabs: { href: string; label: string; exact?: boolean }[] }) {
  const path = usePathname();
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-fg/[0.06]">
      {tabs.map((t) => {
        const active = t.exact ? path === t.href : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${active ? "border-brand-400 text-fg" : "border-transparent text-ink-400 hover:text-ink-100"}`}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function MobileNav({ links, theme, signInLabel }: { links: { href: string; label: string }[]; theme: "light" | "dark" | "system"; signInLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button className="btn-ghost px-2" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="glass-header absolute inset-x-0 top-16 border-b border-fg/10 p-4">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-ink-200 hover:bg-fg/5">{l.label}</Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-ink-200 hover:bg-fg/5">{signInLabel}</Link>
            <div className="flex flex-wrap items-center gap-2 px-3 pt-3"><LocaleSwitcher /><ThemeToggle initial={theme} compact /></div>
          </div>
        </div>
      )}
    </div>
  );
}

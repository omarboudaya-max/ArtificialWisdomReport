"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button className="btn-ghost px-2" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-white/10 bg-ink-950/95 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-ink-200 hover:bg-white/5">
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-ink-200 hover:bg-white/5">Sign in</Link>
            <div className="px-3 pt-2"><LocaleSwitcher /></div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { LOCALES } from "@/lib/i18n/dictionaries";
import { useT } from "@/lib/i18n/client";

export function LocaleSwitcher() {
  const { locale } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="radiogroup" aria-label="Language" className={`inline-flex items-center gap-0.5 rounded-xl border border-fg/10 bg-fg/[0.03] p-0.5 ${pending ? "opacity-60" : ""}`}>
      <Languages size={14} className="mx-1.5 text-ink-400" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={locale === l.code}
          lang={l.code}
          onClick={() => {
            if (l.code === locale) return;
            document.cookie = `aw_locale=${l.code}; path=/; max-age=31536000; samesite=lax`;
            start(() => router.refresh());
          }}
          className={`rounded-[10px] px-2 py-1 text-xs font-semibold transition ${locale === l.code ? "bg-ink-900 text-ink-100 shadow-sm ring-1 ring-fg/10" : "text-ink-400 hover:text-ink-100"}`}
        >
          {l.code === "ar" ? "ع" : l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

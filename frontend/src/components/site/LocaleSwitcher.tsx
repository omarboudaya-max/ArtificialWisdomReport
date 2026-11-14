"use client";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALES } from "@/lib/i18n/dictionaries";
import { useT } from "@/lib/i18n/client";

export function LocaleSwitcher() {
  const { locale } = useT();
  const router = useRouter();
  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-ink-300">
      <Globe size={14} />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => {
          document.cookie = `aw_locale=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        className="cursor-pointer bg-transparent pe-1 font-semibold text-ink-100 outline-none"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-ink-900">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

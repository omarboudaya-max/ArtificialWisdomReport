"use client";
import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Theme = "light" | "dark" | "system";

function persistTheme(next: Theme) {
  document.cookie = `aw_theme=${next}; path=/; max-age=31536000; samesite=lax`;
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
}

/** Light / Dark / System. "System" follows the OS appearance (e.g. macOS Appearance) live, via CSS. */
export function ThemeToggle({ initial, compact = false }: { initial: Theme; compact?: boolean }) {
  const { t } = useT();
  const [theme, setTheme] = useState<Theme>(initial);
  const apply = (next: Theme) => {
    setTheme(next);
    persistTheme(next);
  };
  const opts: { v: Theme; Icon: typeof Sun; label: string }[] = [
    { v: "light", Icon: Sun, label: t("theme.light") },
    { v: "dark", Icon: Moon, label: t("theme.dark") },
    { v: "system", Icon: Monitor, label: t("theme.system") },
  ];
  return (
    <div role="radiogroup" aria-label={t("theme.label")} className="inline-flex items-center gap-0.5 rounded-xl border border-fg/10 bg-fg/[0.03] p-0.5">
      {opts.map(({ v, Icon, label }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          title={label}
          onClick={() => apply(v)}
          className={`flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-xs font-medium transition ${theme === v ? "bg-ink-900 text-ink-100 shadow-sm ring-1 ring-fg/10" : "text-ink-400 hover:text-ink-100"}`}
        >
          <Icon size={14} />
          {!compact && <span className="hidden xl:inline">{label}</span>}
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}

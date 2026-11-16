import "server-only";
import { cookies } from "next/headers";
import { DICTIONARIES, LOCALES, type Locale, type TKey } from "./dictionaries";
import { fmtDate, ratingKey } from "./format";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("aw_locale")?.value;
  return (LOCALES.find((l) => l.code === v)?.code ?? "en") as Locale;
}

export async function getT() {
  const locale = await getLocale();
  const d = DICTIONARIES[locale];
  const t = (k: TKey) => d[k] ?? DICTIONARIES.en[k] ?? k;
  return {
    locale, dir: LOCALES.find((l) => l.code === locale)!.dir, t,
    rating: (r: string | null | undefined) => { const k = ratingKey(r); return k ? t(k) : (r ?? ""); },
    date: (v: string | Date | null | undefined, withTime = false) => fmtDate(v, locale, withTime),
  };
}

export type Theme = "light" | "dark" | "system";
export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get("aw_theme")?.value;
  return v === "light" || v === "dark" ? v : "system";
}

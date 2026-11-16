"use client";
import { createContext, useContext } from "react";
import { DICTIONARIES, type Locale, type TKey } from "./dictionaries";
import { fmtDate, ratingKey } from "./format";

const Ctx = createContext<Locale>("en");
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}
export function useT() {
  const locale = useContext(Ctx);
  const d = DICTIONARIES[locale];
  const t = (k: TKey) => d[k] ?? DICTIONARIES.en[k] ?? k;
  return {
    locale, t,
    rating: (r: string | null | undefined) => { const k = ratingKey(r); return k ? t(k) : (r ?? ""); },
    date: (v: string | Date | null | undefined, withTime = false) => fmtDate(v, locale, withTime),
  };
}

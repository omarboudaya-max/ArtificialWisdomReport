"use client";
import { createContext, useContext } from "react";
import { DICTIONARIES, type Locale, type TKey } from "./dictionaries";

const Ctx = createContext<Locale>("en");
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}
export function useT() {
  const locale = useContext(Ctx);
  const d = DICTIONARIES[locale];
  return { locale, t: (k: TKey) => d[k] ?? DICTIONARIES.en[k] ?? k };
}

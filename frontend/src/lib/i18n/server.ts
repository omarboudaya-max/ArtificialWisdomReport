import "server-only";
import { cookies } from "next/headers";
import { DICTIONARIES, LOCALES, type Locale, type TKey } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("aw_locale")?.value;
  return (LOCALES.find((l) => l.code === v)?.code ?? "en") as Locale;
}

export async function getT() {
  const locale = await getLocale();
  const d = DICTIONARIES[locale];
  return { locale, dir: LOCALES.find((l) => l.code === locale)!.dir, t: (k: TKey) => d[k] ?? DICTIONARIES.en[k] ?? k };
}

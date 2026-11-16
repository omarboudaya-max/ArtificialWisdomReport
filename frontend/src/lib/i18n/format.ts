import type { Locale, TKey } from "./dictionaries";

/** Intl locale tags. Arabic uses Maghreb conventions with Western digits (as in Tunisia). */
const TAG: Record<Locale, string> = { en: "en-GB", fr: "fr-FR", ar: "ar-TN-u-nu-latn" };

export function fmtDate(d: string | Date | null | undefined, locale: Locale, withTime = false) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(TAG[locale], withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

export function fmtNumber(n: number | null | undefined, locale: Locale, digits = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(TAG[locale], { maximumFractionDigits: digits }).format(n);
}

const RATING_KEYS: Record<string, TKey> = {
  "Advanced Trustworthiness": "rating.advanced",
  "Strong Trustworthiness": "rating.strong",
  "Developing Trustworthiness": "rating.developing",
  "Significant Improvement Required": "rating.improvement",
  "High Risk / Critical Gaps": "rating.critical",
  "Insufficient Evidence": "rating.insufficient",
};
/** Stored ratings are English; translate them for display. */
export const ratingKey = (rating: string | null | undefined): TKey | null => (rating ? RATING_KEYS[rating] ?? null : null);

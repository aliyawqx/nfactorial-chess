export const LOCALES = ["ru", "en", "kk"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  kk: "Қазақша",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  kk: "🇰🇿",
};

export const LOCALE_BCP47: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
  kk: "kk-KZ",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_BCP47,
  isLocale,
  type Locale,
} from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

const STORAGE_KEY = "voicechess:locale";

type I18nContextValue = {
  locale: Locale;
  bcp47: string;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
        return;
      }
      const browser = window.navigator.language.split("-")[0];
      if (isLocale(browser)) {
        setLocaleState(browser);
        document.documentElement.lang = browser;
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      document.documentElement.lang = next;
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      bcp47: LOCALE_BCP47[locale],
      setLocale,
      t: dictionaries[locale],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

export function useT(): Dictionary {
  return useI18n().t;
}

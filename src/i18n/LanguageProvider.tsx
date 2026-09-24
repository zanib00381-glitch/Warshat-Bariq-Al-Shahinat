"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import ar from "./ar.json";
import en from "./en.json";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, directionOf, isLanguage, type Language } from "./languages";
import ur from "./ur.json";

export type { Language } from "./languages";

type Dictionary = typeof en;
// Compile-time check that ar.json and ur.json have exactly the same keys as en.json.
const dictionaries: Record<Language, Dictionary> = { en, ar, ur };

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Dot-path key into the dictionaries, e.g. "actions.generate". */
export type TranslationKey = Leaves<Dictionary>;

const listeners = new Set<() => void>();

function readCookieLanguage(): Language | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_STORAGE_KEY}=([^;]*)`));
  return match && isLanguage(match[1]) ? match[1] : null;
}

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // storage unavailable — fall back to the cookie
  }
  return readCookieLanguage() ?? DEFAULT_LANGUAGE;
}

function writeCookie(lang: Language) {
  document.cookie = `${LANGUAGE_STORAGE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === LANGUAGE_STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage); // keep other tabs in sync
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function storeLanguage(lang: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Storage unavailable (private mode etc.) — the cookie still remembers it.
  }
  writeCookie(lang);
  listeners.forEach((l) => l());
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Holds the UI language (English, Arabic or Urdu) and keeps <html lang/dir> in
 * sync: English is left-to-right, Arabic and Urdu right-to-left.
 * `initialLanguage` comes from the cookie on the server, so the first paint
 * already has the right language and direction. The official card must not use this.
 */
export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Language; children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, readStoredLanguage, () => initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = directionOf(language);
    writeCookie(language); // e.g. a choice saved in localStorage before the cookie existed
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => {
      const value = key
        .split(".")
        .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dictionaries[language]);
      if (typeof value !== "string") return key;
      return vars ? value.replace(/\{(\w+)\}/g, (m, name) => vars[name] ?? m) : value;
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage: storeLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

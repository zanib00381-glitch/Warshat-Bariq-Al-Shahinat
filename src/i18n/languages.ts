/** UI languages. Shared by server (root layout) and client (LanguageProvider). */
export const LANGUAGES = ["en", "ar", "ur"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

/** localStorage key, mirrored into a cookie of the same name so the server can render the right language/direction. */
export const LANGUAGE_STORAGE_KEY = "upd-ui-language";

export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", ar: "عربي", ur: "اردو" };

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

export function directionOf(lang: Language): "ltr" | "rtl" {
  return lang === "en" ? "ltr" : "rtl";
}

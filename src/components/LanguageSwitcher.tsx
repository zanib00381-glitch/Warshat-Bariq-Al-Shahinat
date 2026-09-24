"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import { LANGUAGES, LANGUAGE_NAMES } from "@/i18n/languages";

/** Segmented English / عربي / اردو switch. Each name is shown in its own language. */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("language.switch")}
      className="flex items-center gap-0.5 rounded-full border border-brand/30 bg-white p-1 text-sm font-semibold shadow-sm"
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={language === lang}
          onClick={() => setLanguage(lang)}
          className={`rounded-full px-3 py-1 transition-colors ${
            language === lang ? "bg-brand text-white" : "text-brand hover:bg-brand/10"
          }`}
        >
          {LANGUAGE_NAMES[lang]}
        </button>
      ))}
    </div>
  );
}

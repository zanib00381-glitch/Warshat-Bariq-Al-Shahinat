"use client";

import { useEffect } from "react";
import { COMPANY } from "@/config/company";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";

/**
 * Keeps the browser-tab title in the current UI language. (Static `metadata`
 * titles are server-rendered in English, the default, and can't see the toggle.)
 */
export function PageTitle({ titleKey }: { titleKey: TranslationKey }) {
  const { t, language } = useLanguage();
  useEffect(() => {
    document.title = `${t(titleKey)} | ${language === "en" ? COMPANY.name_en : COMPANY.name_ar}`;
  }, [t, titleKey, language]);
  return null;
}

"use client";

import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";
import { Spinner } from "./Spinner";

/** Full-page loading state used by `loading.tsx` files while server data is fetched. */
export function PageLoading({ labelKey = "messages.loading" }: { labelKey?: TranslationKey }) {
  const { t } = useLanguage();
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-slate-500" aria-busy>
      <Spinner className="h-8 w-8 text-brand" />
      <p role="status">{t(labelKey)}</p>
    </main>
  );
}

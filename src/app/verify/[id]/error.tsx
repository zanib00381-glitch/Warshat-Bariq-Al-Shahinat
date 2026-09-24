"use client";

import { useEffect } from "react";
import { CompanyContact } from "@/components/CompanyContact";
import { PageTitle } from "@/components/PageTitle";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Shown when the lookup itself fails (e.g. database unreachable). Deliberately
 * neutral — an outage must never make a genuine card look fake.
 */
export default function VerifyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="w-full flex-1 bg-[#fcfcfc] px-4 py-6">
      <PageTitle titleKey="verify.errorTitle" />
      <div className="mx-auto max-w-xl space-y-5">
        <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <h1 className="text-xl font-bold">{t("verify.errorTitle")}</h1>
          <p className="mt-2 leading-relaxed">{t("verify.errorDesc")}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {t("verify.retry")}
          </button>
        </section>
        <CompanyContact />
      </div>
    </main>
  );
}

"use client";

import { CompanyContact } from "@/components/CompanyContact";
import { PageTitle } from "@/components/PageTitle";
import { useLanguage } from "@/i18n/LanguageProvider";

/** The red "could not be verified" verdict for an unknown card id (rendered by page.tsx). */
export function CardNotVerified() {
  const { t } = useLanguage();

  return (
    <main className="w-full flex-1 bg-[#fcfcfc] px-4 py-6">
      <PageTitle titleKey="verify.notVerifiedTitle" />
      <div className="mx-auto max-w-xl space-y-5">
        <section role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-5 text-red-900 shadow-sm">
          <div className="flex items-start gap-3">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-2xl font-black text-white">
              !
            </span>
            <div>
              <h1 className="text-xl font-bold text-red-700">{t("verify.notVerifiedTitle")}</h1>
              <p className="mt-2 leading-relaxed">{t("verify.invalidDesc")}</p>
              <p className="mt-2 font-semibold">{t("verify.notVerifiedAdvice")}</p>
            </div>
          </div>
        </section>
        <CompanyContact />
      </div>
    </main>
  );
}

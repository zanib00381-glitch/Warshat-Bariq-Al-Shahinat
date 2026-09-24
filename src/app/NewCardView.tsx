"use client";

import { CardForm } from "@/components/form/CardForm";
import { PageTitle } from "@/components/PageTitle";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Admin form: fill in a vehicle's data and generate a new UPD card. */
export function NewCardView() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <PageTitle titleKey="home.title" />
      <h1 className="mb-6 text-2xl font-bold text-brand">{t("home.title")}</h1>
      <CardForm />
    </main>
  );
}

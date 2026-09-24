"use client";

import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Site-wide 404 (unknown URLs), in the current UI language. */
export default function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <PageTitle titleKey="notFound.title" />
      <p className="text-5xl font-black text-brand/30">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-800">{t("notFound.title")}</h1>
      <p className="mt-2 text-slate-500">{t("notFound.desc")}</p>
      <Link href="/" className="mt-6 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
        {t("notFound.home")}
      </Link>
    </main>
  );
}

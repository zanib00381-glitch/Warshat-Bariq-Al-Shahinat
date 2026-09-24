"use client";

import Image from "next/image";
import { useState } from "react";
import { CardScaler } from "@/components/card/CardScaler";
import { UpdCard } from "@/components/card/UpdCard";
import { CompanyContact } from "@/components/CompanyContact";
import { PageTitle } from "@/components/PageTitle";
import { COMPANY } from "@/config/company";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";
import { copyText } from "@/lib/card-pdf";
import { formatDisplayDate, type PublicCard } from "@/lib/cards";
import { formatUnderRunNumberForDisplay } from "@/lib/under-run-number";

type Props = { card: PublicCard; qrSvg: string };

/**
 * Public, read-only verification page. The surrounding UI follows the Arabic/Urdu
 * toggle; the official card inside it is the fixed bilingual component.
 */
export function VerifyView({ card, qrSvg }: Props) {
  const { t } = useLanguage();

  const fields: { label: TranslationKey; value: string; ltr?: boolean }[] = [
    {
      label: "form.sectionNumber",
      value: formatUnderRunNumberForDisplay(card.under_run_number_prefix, card.upd_type, card.under_run_number_suffix),
      ltr: true,
    },
    { label: "form.chassisNumber", value: card.vehicle_chassis_number, ltr: true },
    { label: "form.vehicleBrand", value: card.vehicle_brand },
    { label: "form.vehicleModelName", value: card.vehicle_model_name },
    { label: "form.vehicleModelYear", value: card.vehicle_model_year, ltr: true },
    { label: "form.updType", value: card.upd_type, ltr: true },
    { label: "form.cardIssueDate", value: formatDisplayDate(card.card_issue_date), ltr: true },
  ];

  return (
    <main className="w-full flex-1 bg-[#fcfcfc] px-4 py-6">
      <PageTitle titleKey="verify.title" />
      <div className="mx-auto max-w-xl space-y-5">
        <h1 className="text-2xl leading-snug font-bold text-slate-900">{t("verify.pageTitle")}</h1>

        {/* Green "verified" banner, as in the reference screenshot */}
        <section className="rounded-xl bg-[#00a651] p-4 text-white shadow-sm" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-white p-1">
              <Image src={COMPANY.logo_path} alt="" width={72} height={48} className="h-full w-auto" />
            </span>
            <div className="min-w-0">
              <div lang="ar" className="text-xl font-bold">
                {card.manufacturer_name}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                <span aria-hidden>✅</span>
                {t("verify.verified")}
              </div>
            </div>
          </div>
          <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-900">
            {t("verify.manufactureDate")}
            <span dir="ltr" className="font-sans">
              {formatDisplayDate(card.date_of_manufacture)}
            </span>
          </div>
        </section>

        {/* Read-only summary in grey rounded boxes */}
        <dl className="space-y-3">
          {fields.map(({ label, value, ltr }) => (
            <div key={label}>
              <dt className="mb-1 text-[15px] text-[#3a8fa3]">{t(label)}</dt>
              <dd className="rounded-lg border border-[#e3e3e3] bg-[#f3f3f3] px-4 py-3 text-start font-sans text-[17px] font-medium break-words text-black">
                <span dir={ltr ? "ltr" : "auto"}>{value}</span>
              </dd>
            </div>
          ))}
        </dl>

        <CopyLinkBox url={card.qr_url} />
      </div>

      <section className="mx-auto mt-8 max-w-6xl">
        <h2 className="mb-3 text-lg font-bold text-slate-800">{t("verify.officialCard")}</h2>
        <CardScaler>
          <UpdCard card={card} qrSvg={qrSvg} />
        </CardScaler>
      </section>

      <div className="mx-auto mt-8 max-w-xl">
        <CompanyContact />
      </div>
    </main>
  );
}

function CopyLinkBox({ url }: { url: string }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <label htmlFor="verify-link" className="mb-1 block text-sm font-semibold text-slate-600">
        {t("verify.linkLabel")}
      </label>
      <input
        id="verify-link"
        readOnly
        dir="ltr"
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={async () => setStatus((await copyText(url)) ? "copied" : "failed")}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
        >
          {t("verify.copyLink")}
        </button>
        {status && (
          <span role="status" className={`text-sm ${status === "copied" ? "text-emerald-700" : "text-red-600"}`}>
            {t(status === "copied" ? "messages.linkCopied" : "messages.copyFailed")}
          </span>
        )}
      </div>
    </section>
  );
}

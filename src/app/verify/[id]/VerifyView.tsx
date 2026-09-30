"use client";

/* eslint-disable @next/next/no-img-element -- barrier pictures come from Supabase Storage or /public */
import { useState } from "react";
import { CardScaler } from "@/components/card/CardScaler";
import { UpdCard } from "@/components/card/UpdCard";
import { CompanyContact } from "@/components/CompanyContact";
import { PageTitle } from "@/components/PageTitle";
import { COMPANY } from "@/config/company";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";
import { barrierPhoto, photoKindsFor, type PhotoKind } from "@/lib/barrier-photos";
import { copyText } from "@/lib/card-pdf";
import { formatDisplayDate, type PublicCard } from "@/lib/cards";

type Props = { card: PublicCard; qrSvg: string };

const BARRIER_NAMES: Record<string, TranslationKey> = {
  F: "verify.frontBarrier",
  S: "verify.sideBarrier",
  R: "verify.rearBarrier",
};

/**
 * Public, read-only verification page: the card number and issuer, a "Valid"
 * status, the card data, barrier pictures, then the official card. The page UI
 * follows the language switch; the official card inside it never changes.
 */
export function VerifyView({ card, qrSvg }: Props) {
  const { t, language } = useLanguage();

  // Show the company's English name in the English UI when the card carries the configured Arabic name.
  const companyName = language === "en" && card.manufacturer_name === COMPANY.name_ar ? COMPANY.name_en : card.manufacturer_name;
  const address = language === "en" ? COMPANY.address_en : COMPANY.address_ar;
  const deviceType = card.upd_type
    .split("/")
    .map((letter) => (BARRIER_NAMES[letter] ? t(BARRIER_NAMES[letter]) : letter))
    .join(language === "en" ? ", " : "، ");

  return (
    <main className="w-full flex-1 bg-[#f7f8fa] px-4 py-6">
      <PageTitle titleKey="verify.title" />
      <div className="mx-auto max-w-5xl space-y-5">
        {/* 1. Card number, issuer and status */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <p dir="ltr" className="text-start font-sans text-3xl font-bold tracking-wide text-slate-900 rtl:text-right">
            {card.card_number}
          </p>
          <p className="mt-1 text-slate-600">{t("verify.cardTitle")}</p>

          <dl className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <Item label={t("verify.companyName")}>
              <span dir="auto">{companyName}</span>
            </Item>
            <Item label={t("verify.address")}>{address}</Item>
            <Item label={t("verify.applicantType")}>{COMPANY.applicant_type[language]}</Item>
            <Item label={t("verify.issuanceDate")}>
              <span dir="ltr">{formatDisplayDate(card.card_issue_date)}</span>
            </Item>
            <Item label={t("verify.status")}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />
                {t("verify.statusValid")}
              </span>
            </Item>
          </dl>
        </section>

        {/* 2. Card data + barrier pictures */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">{t("verify.cardData")}</h2>
          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Item label={t("verify.brandName")}>
              <span dir="auto">{card.vehicle_brand}</span>
            </Item>
            <Item label={t("verify.deviceType")}>{deviceType}</Item>
            <Item label={t("form.vehicleModelName")}>
              <span dir="auto">{card.vehicle_model_name}</span>
            </Item>
            <Item label={t("form.vehicleModelYear")}>
              <span dir="ltr">{card.vehicle_model_year}</span>
            </Item>
            <Item label={t("form.chassisNumber")}>
              <span dir="ltr">{card.vehicle_chassis_number}</span>
            </Item>
            <Item label={t("verify.manufactureDate")}>
              <span dir="ltr">{formatDisplayDate(card.date_of_manufacture)}</span>
            </Item>
            <Item label={t("verify.updSerial")}>
              <span dir="ltr">{card.under_run_number_suffix}</span>
            </Item>
            <Item label={t("verify.updUnique")}>
              <span dir="ltr">{card.under_run_number_full}</span>
            </Item>
          </dl>

          {photoKindsFor(card.upd_type).length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {photoKindsFor(card.upd_type).map((kind) => (
                <BarrierPicture key={kind} kind={kind} card={card} />
              ))}
            </div>
          )}
        </section>

        <CopyLinkBox url={card.qr_url} />

        {/* 3. The official card (fixed bilingual format) */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-800">{t("verify.officialCard")}</h2>
          <CardScaler>
            <UpdCard card={card} qrSvg={qrSvg} />
          </CardScaler>
        </section>

        <div className="mx-auto max-w-xl">
          <CompanyContact />
        </div>
      </div>
    </main>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-sans font-semibold break-words text-slate-900">{children}</dd>
    </div>
  );
}

function BarrierPicture({ kind, card }: { kind: PhotoKind; card: PublicCard }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const photo = barrierPhoto(card, kind);
  const label = kind === "side" ? t("form.sidePhoto") : t("form.rearPhoto");

  return (
    <figure>
      <figcaption className="mb-1.5 text-sm font-semibold text-slate-700">{label}</figcaption>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-start"
        aria-label={`${t("verify.viewImage")}: ${label}`}
      >
        <img src={photo.url} alt={label} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-xs font-semibold text-white">
          <span>{photo.isDefault ? t("verify.illustrative") : ""}</span>
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t("verify.viewImage")}
          </span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <img src={photo.url} alt={label} className="max-h-full max-w-full rounded-lg bg-white object-contain" />
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(false)}
            className="absolute end-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-800"
          >
            {t("actions.close")}
          </button>
        </div>
      )}
    </figure>
  );
}

function CopyLinkBox({ url }: { url: string }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <label htmlFor="verify-link" className="mb-1 block text-sm font-semibold text-slate-600">
        {t("verify.linkLabel")}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="verify-link"
          readOnly
          dir="ltr"
          value={url}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          onClick={async () => setStatus((await copyText(url)) ? "copied" : "failed")}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
        >
          {t("verify.copyLink")}
        </button>
      </div>
      {status && (
        <p role="status" className={`mt-2 text-sm ${status === "copied" ? "text-emerald-700" : "text-red-600"}`}>
          {t(status === "copied" ? "messages.linkCopied" : "messages.copyFailed")}
        </p>
      )}
    </section>
  );
}

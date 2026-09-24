"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { UpdCard } from "@/components/card/UpdCard";
import { PageTitle } from "@/components/PageTitle";
import { useLanguage } from "@/i18n/LanguageProvider";
import { copyText, downloadCardPdf } from "@/lib/card-pdf";
import { formatCardDate, type PublicCard } from "@/lib/cards";
import { qrSvgFor } from "@/lib/qr";

/** Uppercase and drop spaces/slashes/dashes so "ksa e30 s/r/f" matches "KSAE30S/R/F…". */
const normalize = (s: string) => s.toUpperCase().replace(/[\s/-]/g, "");

const actionClass =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand disabled:opacity-50";

export function CardsTable({ cards }: { cards: PublicCard[] }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<{ card: PublicCard; qrSvg: string } | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const index = useMemo(
    () =>
      cards.map((c) => ({
        card: c,
        haystack: normalize(
          [c.vehicle_chassis_number, c.vehicle_brand, c.vehicle_model_name, c.under_run_number_full].join("|"),
        ),
      })),
    [cards],
  );
  const needle = normalize(deferredQuery);
  const visible = needle ? index.filter((e) => e.haystack.includes(needle)).map((e) => e.card) : cards;

  const onCopy = async (card: PublicCard) => {
    if (await copyText(card.qr_url)) {
      setCopiedId(card.id);
      setTimeout(() => setCopiedId((id) => (id === card.id ? null : id)), 2000);
    }
  };

  const onDownload = async (card: PublicCard) => {
    setPdfError(false);
    setExporting({ card, qrSvg: await qrSvgFor(card.qr_url) });
  };

  // Once the off-screen card has rendered, export it with the same code as the preview page.
  useEffect(() => {
    if (!exporting || !exportRef.current) return;
    downloadCardPdf(exportRef.current, exporting.card.under_run_number_full)
      .catch((err) => {
        console.error("PDF export failed:", err);
        setPdfError(true);
      })
      .finally(() => setExporting(null));
  }, [exporting]);

  const countText =
    visible.length === cards.length
      ? t("cards.count", { n: String(cards.length) })
      : t("cards.countFiltered", { shown: String(visible.length), n: String(cards.length) });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <PageTitle titleKey="cards.title" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand">{t("cards.title")}</h1>
        <Link href="/" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
          + {t("nav.newCard")}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cards.search")}
          aria-label={t("cards.search")}
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <span className="text-sm text-slate-500">{countText}</span>
        {pdfError && (
          <span role="alert" className="text-sm text-red-600">
            {t("messages.pdfFailed")}
          </span>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          {t("messages.noCards")}
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          <p>{t("cards.noResults")}</p>
          <button type="button" onClick={() => setQuery("")} className="mt-3 text-sm font-semibold text-brand hover:underline">
            {t("cards.clearSearch")}
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 md:hidden">
          {visible.map((card) => (
            <li key={card.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-mono text-sm font-bold text-slate-900">
                <span dir="ltr">{card.under_run_number_full}</span>
              </div>
              <div className="mt-1 font-mono text-sm text-slate-600">
                <span dir="ltr">{card.vehicle_chassis_number}</span>
              </div>
              <div className="mt-1 flex justify-between font-sans text-sm text-slate-600">
                <span dir="auto">
                  {card.vehicle_brand} / {card.vehicle_model_name}
                </span>
                <span dir="ltr">{formatCardDate(card.card_issue_date)}</span>
              </div>
              {rowActions(card)}
            </li>
          ))}
        </ul>
      )}

      {visible.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-start">
                <th className="px-4 py-3 text-start font-semibold">{t("form.chassisNumber")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("cards.brandModel")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("form.sectionNumber")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("form.cardIssueDate")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("cards.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono">
                    <span dir="ltr">{card.vehicle_chassis_number}</span>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span dir="auto">{card.vehicle_brand}</span> / <span dir="auto">{card.vehicle_model_name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    <span dir="ltr">{card.under_run_number_full}</span>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span dir="ltr">{formatCardDate(card.card_issue_date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {rowActions(card)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Off-screen render target for "Download PDF" from the list */}
      {exporting && (
        <div aria-hidden className="pointer-events-none fixed top-0 -left-[10000px]" dir="ltr">
          <UpdCard ref={exportRef} card={exporting.card} qrSvg={exporting.qrSvg} />
        </div>
      )}
    </main>
  );

  function rowActions(card: PublicCard) {
    const busy = exporting?.card.id === card.id;
    return (
      <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
        <Link href={`/cards/${card.id}/preview`} className={actionClass}>
          {t("actions.view")}
        </Link>
        <button type="button" onClick={() => onCopy(card)} className={actionClass}>
          {copiedId === card.id ? t("actions.copied") : t("actions.copyLink")}
        </button>
        <button type="button" onClick={() => onDownload(card)} disabled={!!exporting} className={actionClass}>
          {busy ? t("messages.preparingPdf") : t("actions.downloadPdf")}
        </button>
      </div>
    );
  }
}

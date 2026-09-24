"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardScaler } from "@/components/card/CardScaler";
import { PageTitle } from "@/components/PageTitle";
import { Spinner } from "@/components/Spinner";
import { Toast } from "@/components/Toast";
import { UpdCard } from "@/components/card/UpdCard";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";
import { copyText, downloadCardPdf } from "@/lib/card-pdf";
import type { UpdCard as UpdCardRecord } from "@/lib/cards";

type Props = { card: UpdCardRecord; qrSvg: string; justCreated: boolean };

const buttonClass =
  "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand hover:text-brand disabled:opacity-60";

/** Page chrome uses the Arabic/Urdu UI language; the card itself stays fixed bilingual. */
export function CardPreview({ card, qrSvg, justCreated }: Props) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<{ key: TranslationKey; error?: boolean } | null>(null);
  const [toast, setToast] = useState<{ key: TranslationKey; error?: boolean } | null>(
    justCreated ? { key: "preview.created" } : null,
  );
  const closeToast = useCallback(() => setToast(null), []);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Drop ?created=1 from the address bar so reloading doesn't show "created" again.
  useEffect(() => {
    if (justCreated) window.history.replaceState(null, "", window.location.pathname);
  }, [justCreated]);

  const onCopy = async () => {
    const ok = await copyText(card.qr_url);
    setToast(ok ? { key: "messages.linkCopied" } : { key: "messages.copyFailed", error: true });
  };

  const onDownload = async () => {
    if (!cardRef.current) return;
    setPdfBusy(true);
    setStatus({ key: "messages.preparingPdf" });
    try {
      await downloadCardPdf(cardRef.current, card.under_run_number_full);
      setStatus(null);
    } catch (err) {
      console.error("PDF export failed:", err);
      setStatus({ key: "messages.pdfFailed", error: true });
    }
    setPdfBusy(false);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:m-0 print:max-w-none print:p-0">
      <PageTitle titleKey="preview.title" />
      <Toast
        message={toast && t(toast.key)}
        tone={toast?.error ? "error" : "success"}
        onClose={closeToast}
        closeLabel={t("actions.close")}
      />
      <div className="mb-6 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-brand">{t("preview.title")}</h1>
          <Link href="/" className="text-sm font-semibold text-brand hover:underline">
            + {t("actions.createAnother")}
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label htmlFor="verify-url" className="mb-1 block text-sm font-semibold text-slate-700">
            {t("preview.verifyLink")}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="verify-url"
              readOnly
              dir="ltr"
              value={card.qr_url}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm"
            />
            <button type="button" onClick={onCopy} className={buttonClass}>
              {t("actions.copyVerifyLink")}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onDownload} disabled={pdfBusy} className={`${buttonClass} border-brand! bg-brand! text-white!`}>
            {pdfBusy && <Spinner />}
            {t("actions.downloadPdf")}
          </button>
          <button type="button" onClick={() => window.print()} className={buttonClass}>
            {t("actions.print")}
          </button>
          <a href={card.qr_url} target="_blank" rel="noopener" className={buttonClass}>
            {t("actions.openVerify")}
          </a>
          {status && (
            <p role={status.error ? "alert" : "status"} className={`text-sm ${status.error ? "text-red-600" : "text-emerald-700"}`}>
              {t(status.key)}
            </p>
          )}
        </div>
      </div>

      <CardScaler>
        <UpdCard ref={cardRef} card={card} qrSvg={qrSvg} />
      </CardScaler>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { RECORD_TEXT, RecordShell } from "./RecordShell";
import s from "./RecordPage.module.css";

/**
 * Shown when the lookup itself fails (e.g. database unreachable). Deliberately
 * neutral — an outage must never make a genuine card look fake.
 */
export default function VerifyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RecordShell>
      <section role="alert" className={`${s.band} ${s.bandWarning}`}>
        <strong>{RECORD_TEXT.errorTitle}</strong>
        <p>{RECORD_TEXT.errorDesc}</p>
        <button type="button" onClick={reset} className={s.bandButton}>
          {RECORD_TEXT.retry}
        </button>
      </section>
      <div className={s.fields} />
    </RecordShell>
  );
}

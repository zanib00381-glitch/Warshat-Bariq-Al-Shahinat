import { RECORD_TEXT, RecordShell } from "./RecordShell";
import s from "./RecordPage.module.css";

/** Unknown card id: the same page frame with a red "could not be verified" band. */
export function CardNotVerified() {
  return (
    <RecordShell>
      <section role="alert" className={`${s.band} ${s.bandDanger}`}>
        <strong>{RECORD_TEXT.notVerifiedTitle}</strong>
        <p>{RECORD_TEXT.notVerifiedDesc}</p>
      </section>
      <div className={s.fields} />
    </RecordShell>
  );
}

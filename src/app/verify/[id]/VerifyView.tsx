import { formatDisplayDate, type PublicCard } from "@/lib/cards";
import { formatUnderRunNumberForDisplay } from "@/lib/under-run-number";
import { RECORD_TEXT, RecordShell } from "./RecordShell";
import s from "./RecordPage.module.css";

/**
 * Public record page for a genuine card: an exact replica of the client's
 * reference layout (green company band + grey field boxes), Arabic only.
 */
export function VerifyView({ card }: { card: PublicCard }) {
  const barrierNo = formatUnderRunNumberForDisplay(card.under_run_number_prefix, card.upd_type, card.under_run_number_suffix);
  const fields: { label: string; value: string; mono?: boolean }[] = [
    { label: RECORD_TEXT.fields.barrierNo, value: barrierNo, mono: true },
    { label: RECORD_TEXT.fields.vehicleType, value: card.vehicle_type },
    { label: RECORD_TEXT.fields.vin, value: card.vehicle_chassis_number, mono: true },
    { label: RECORD_TEXT.fields.brand, value: card.vehicle_brand },
    { label: RECORD_TEXT.fields.model, value: card.vehicle_model_name },
    { label: RECORD_TEXT.fields.modelYear, value: card.vehicle_model_year },
  ];

  return (
    <RecordShell feedbackSubject={barrierNo}>
      <section className={s.band}>
        <strong>{card.manufacturer_name}</strong>
        <span>
          {RECORD_TEXT.madeOn} <b>{formatDisplayDate(card.date_of_manufacture)}</b>
        </span>
      </section>

      <div className={s.fields}>
        {fields.map(({ label, value, mono }) => (
          <div key={label} className={s.field}>
            <span className={s.fieldLabel}>{label}</span>
            <output className={mono ? s.mono : undefined} dir={mono ? "ltr" : "auto"}>
              {value}
            </output>
          </div>
        ))}
      </div>
    </RecordShell>
  );
}

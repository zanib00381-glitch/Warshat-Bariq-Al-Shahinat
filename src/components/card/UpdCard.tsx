/* eslint-disable @next/next/no-img-element -- a plain <img> keeps the logo exportable to PDF */
import { CARD_TEXT } from "@/config/card-template";
import { COMPANY } from "@/config/company";
import { formatCardDate, type UpdCard as UpdCardRecord } from "@/lib/cards";
import s from "./UpdCard.module.css";

/**
 * The official UPD card — a replica of the reference PDF.
 *
 * Its text is FIXED bilingual Arabic + English from `CARD_TEXT`. It deliberately
 * does not use the app's Arabic/Urdu `t()` system: the UI language toggle must
 * never change this regulatory document.
 */
export type UpdCardData = Pick<
  UpdCardRecord,
  | "manufacturer_name"
  | "manufacturer_code"
  | "country_of_origin"
  | "date_of_manufacture"
  | "technical_references"
  | "vehicle_model_name"
  | "vehicle_brand"
  | "vehicle_model_year"
  | "upd_type"
  | "vehicle_chassis_number"
  | "under_run_number_prefix"
  | "under_run_number_suffix"
  | "card_issue_date"
>;

type Props = {
  card: UpdCardData;
  /** Inline SVG markup of the QR code (generated server-side from the verification URL). */
  qrSvg: string;
  ref?: React.Ref<HTMLDivElement>;
};

type RowKey = keyof typeof CARD_TEXT.rows;

/** Renders Latin runs inside an Arabic label (e.g. "(VIN)") in regular weight, as in the reference. */
function ArabicLabel({ text }: { text: string }) {
  return text.split(/([A-Za-z0-9()/]+)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={s.latin}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Row({ label, tall, children }: { label: RowKey; tall?: boolean; children: React.ReactNode }) {
  const text = CARD_TEXT.rows[label];
  return (
    <div className={`${s.row} ${tall ? s.tall : ""}`}>
      <div className={`${s.label} ${s.labelEn}`}>{text.en}</div>
      <div className={s.value} dir="auto">
        {children}
      </div>
      <div lang="ar" className={`${s.label} ${s.labelAr}`}>
        <span>
          <ArabicLabel text={text.ar} />
        </span>
      </div>
    </div>
  );
}

/** Splits the stored number back into its 16 printed cells (cell 7 = UPD type). */
function numberCells(card: UpdCardData): string[] {
  const fixed = card.under_run_number_prefix.slice(0, 6).split("");
  return [...fixed, card.upd_type, ...card.under_run_number_suffix.split("")];
}

export function UpdCard({ card, qrSvg, ref }: Props) {
  const cells = numberCells(card);

  return (
    <div ref={ref} className={s.card} data-upd-card>
      <div className={s.qr} dangerouslySetInnerHTML={{ __html: qrSvg }} />

      <div lang="ar" className={s.titleAr}>
        {CARD_TEXT.title_ar}
      </div>
      <div className={s.titleEn}>{CARD_TEXT.title_en}</div>
      <div className={s.subtitle}>
        {CARD_TEXT.manufacturer_section_en} <span lang="ar">{CARD_TEXT.manufacturer_section_ar}</span>
      </div>

      <img className={s.logo} src={COMPANY.logo_card_path} alt={COMPANY.name_en} />

      <svg className={s.close} viewBox="0 0 12 12" aria-hidden>
        <rect x="0.4" y="0.4" width="11.2" height="11.2" fill="#fff" stroke="#6b6b6b" strokeWidth="0.8" />
        <path d="M3 3 L9.8 9.5 M9.8 3 L3 9.5" stroke="#e02121" strokeWidth="1.3" />
      </svg>

      <div className={s.table}>
        <Row label="manufacturer_name">{card.manufacturer_name}</Row>
        <Row label="manufacturer_code" tall>
          {card.manufacturer_code}
        </Row>
        <Row label="country_of_origin">{card.country_of_origin}</Row>
        <Row label="date_of_manufacture">{formatCardDate(card.date_of_manufacture)}</Row>
        <Row label="technical_references">{card.technical_references}</Row>

        <div className={s.sectionHeading}>
          {CARD_TEXT.vehicle_section_en}&nbsp;<span lang="ar">{CARD_TEXT.vehicle_section_ar}</span>
        </div>

        <Row label="vehicle_model_name">{card.vehicle_model_name}</Row>
        <Row label="vehicle_brand">{card.vehicle_brand}</Row>
        <Row label="vehicle_model_year">{card.vehicle_model_year}</Row>
        <Row label="upd_type" tall>
          {card.upd_type}
        </Row>
        <Row label="vehicle_chassis_number" tall>
          {card.vehicle_chassis_number}
        </Row>

        <div className={`${s.row} ${s.numberRow}`}>
          <div className={`${s.label} ${s.labelEn}`}>{CARD_TEXT.rows.under_run_number.en}</div>
          <div className={s.numberCell}>
            <div className={s.cells}>
              {cells.map((value, i) => (
                // In the reference PDF cells 8 and 9 share one box (no gap between them).
                <div key={i} className={`${s.cell} ${i === 7 ? s.joinedLeft : i === 8 ? s.joined : ""}`}>
                  <div className={s.cellIndex}>{i + 1}</div>
                  <div className={s.cellValue}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div lang="ar" className={`${s.label} ${s.labelAr}`}>
            <span>
              <ArabicLabel text={CARD_TEXT.rows.under_run_number.ar} />
            </span>
          </div>
        </div>

        <Row label="card_issue_date">{formatCardDate(card.card_issue_date)}</Row>
      </div>

      <div className={s.rule} />
      <div className={s.footerEn}>
        {CARD_TEXT.footer_en.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div lang="ar" className={s.footerAr}>
        {CARD_TEXT.footer_ar.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

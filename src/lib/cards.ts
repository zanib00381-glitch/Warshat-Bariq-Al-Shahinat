import { customAlphabet } from "nanoid";

/** Row shape of the `upd_cards` table (see supabase/schema.sql). */
export type UpdCard = {
  id: string;
  manufacturer_name: string;
  manufacturer_code: string;
  country_of_origin: string;
  date_of_manufacture: string; // YYYY-MM-DD
  technical_references: string;
  vehicle_model_name: string;
  vehicle_brand: string;
  vehicle_model_year: string;
  upd_type: string;
  vehicle_chassis_number: string;
  under_run_number_full: string;
  under_run_number_prefix: string;
  under_run_number_suffix: string;
  card_issue_date: string; // YYYY-MM-DD
  created_at: string;
  created_by: string | null;
  qr_url: string;
};

/** What may be shown publicly (verification page, public API): everything except internal fields. */
export type PublicCard = Omit<UpdCard, "created_by">;

export function toPublicCard(card: UpdCard): PublicCard {
  const { created_by: _internal, ...publicCard } = card; // eslint-disable-line @typescript-eslint/no-unused-vars
  return publicCard;
}

/** Error codes returned by the API; the UI maps them to translated messages. */
export type CardErrorCode =
  | "MISSING_FIELDS"
  | "INVALID_SERIAL"
  | "INVALID_UPD_TYPE"
  | "INVALID_YEAR"
  | "INVALID_DATE"
  | "INVALID_VIN"
  | "INVALID_MANUFACTURER_CODE"
  | "DUPLICATE_NUMBER"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "CONFIG_ERROR"
  | "SERVER_ERROR";

/** 12-char URL-safe public ID (alphanumeric only, so it reads cleanly when shared as text). */
export const generateCardId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

export const CARD_ID_PATTERN = /^[0-9A-Za-z]{12}$/;

/** Today's date in Saudi Arabia, as YYYY-MM-DD. */
export function todayInRiyadh(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

/** "2026-09-16" → "16.09.2026", the date format printed on the card. */
export function formatCardDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

/** "2026-09-16" → "16/09/2026", the date style used on the verification page. */
export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function verificationUrl(origin: string, id: string): string {
  return `${origin.replace(/\/+$/, "")}/verify/${id}`;
}

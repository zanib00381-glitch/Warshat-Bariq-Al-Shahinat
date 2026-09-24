/**
 * Card input normalization + validation, shared by the admin form (instant
 * feedback) and POST /api/cards (the authority).
 */
import { DEFAULT_TECHNICAL_REFERENCES } from "@/config/card-template";
import type { CardErrorCode } from "./cards";
import { isValidSerial, isValidUpdType } from "./under-run-number";

export type CardInput = {
  manufacturer_name: string;
  manufacturer_code: string;
  country_of_origin: string;
  date_of_manufacture: string;
  technical_references: string;
  vehicle_model_name: string;
  vehicle_brand: string;
  vehicle_model_year: string;
  upd_type: string;
  vehicle_chassis_number: string;
  under_run_number_suffix: string;
  card_issue_date: string;
};

export type CardField = keyof CardInput;
export type FieldErrors = Partial<Record<CardField, CardErrorCode>>;

export const MIN_MODEL_YEAR = 1950;
export const maxModelYear = () => new Date().getFullYear() + 1;

const CARD_FIELDS: Record<CardField, true> = {
  manufacturer_name: true,
  manufacturer_code: true,
  country_of_origin: true,
  date_of_manufacture: true,
  technical_references: true,
  vehicle_model_name: true,
  vehicle_brand: true,
  vehicle_model_year: true,
  upd_type: true,
  vehicle_chassis_number: true,
  under_run_number_suffix: true,
  card_issue_date: true,
};

const UPPERCASE_FIELDS: CardField[] = ["manufacturer_code", "upd_type", "vehicle_chassis_number", "under_run_number_suffix"];

export function normalizeCardInput(raw: Partial<Record<CardField, unknown>>): CardInput {
  const input = {} as CardInput;
  for (const key of Object.keys(CARD_FIELDS) as CardField[]) {
    const value = typeof raw[key] === "string" ? (raw[key] as string).trim() : "";
    input[key] = UPPERCASE_FIELDS.includes(key) ? value.toUpperCase() : value;
  }
  input.technical_references ||= DEFAULT_TECHNICAL_REFERENCES;
  return input;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Returns an error code per invalid field; empty object when the input is valid. */
export function validateCardInput(input: CardInput): FieldErrors {
  const errors: FieldErrors = {};
  const check = (field: CardField, ok: boolean, code: CardErrorCode) => {
    if (errors[field]) return;
    if (!input[field]) errors[field] = field === "upd_type" ? "INVALID_UPD_TYPE" : "MISSING_FIELDS";
    else if (!ok) errors[field] = code;
  };

  check("manufacturer_name", true, "MISSING_FIELDS");
  check("manufacturer_code", /^[A-Z0-9]{3}$/.test(input.manufacturer_code), "INVALID_MANUFACTURER_CODE");
  check("country_of_origin", true, "MISSING_FIELDS");
  check("date_of_manufacture", isValidIsoDate(input.date_of_manufacture), "INVALID_DATE");
  check("vehicle_model_name", true, "MISSING_FIELDS");
  check("vehicle_brand", true, "MISSING_FIELDS");
  const year = Number(input.vehicle_model_year);
  check(
    "vehicle_model_year",
    /^\d{4}$/.test(input.vehicle_model_year) && year >= MIN_MODEL_YEAR && year <= maxModelYear(),
    "INVALID_YEAR",
  );
  check("upd_type", isValidUpdType(input.upd_type), "INVALID_UPD_TYPE");
  check("vehicle_chassis_number", /^[A-Z0-9]{10,17}$/.test(input.vehicle_chassis_number), "INVALID_VIN");
  check("under_run_number_suffix", isValidSerial(input.under_run_number_suffix), "INVALID_SERIAL");
  check("card_issue_date", isValidIsoDate(input.card_issue_date), "INVALID_DATE");
  return errors;
}

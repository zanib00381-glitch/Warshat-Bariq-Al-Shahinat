import type { CardErrorCode } from "@/lib/cards";
import type { TranslationKey } from "./LanguageProvider";

/** Maps API / validation error codes to UI messages. */
export const ERROR_MESSAGE_KEYS: Record<CardErrorCode, TranslationKey> = {
  MISSING_FIELDS: "form.required",
  INVALID_SERIAL: "messages.invalidSerial",
  INVALID_UPD_TYPE: "messages.invalidUpdType",
  INVALID_YEAR: "messages.invalidYear",
  INVALID_DATE: "messages.invalidDate",
  INVALID_VIN: "messages.invalidVin",
  INVALID_MANUFACTURER_CODE: "messages.invalidManufacturerCode",
  DUPLICATE_NUMBER: "messages.duplicateNumber",
  NOT_FOUND: "messages.notFound",
  UNAUTHORIZED: "auth.sessionExpired",
  CONFIG_ERROR: "messages.configError",
  SERVER_ERROR: "messages.genericError",
};

/**
 * The 16-cell "Distinguished Under-Run Number" printed on the card:
 *
 *   cells 1-3   country code        K S A        (fixed)
 *   cells 4-6   manufacturer code   E 3 0        (from company config)
 *   cell  7     UPD type            S/R/F        (may hold several characters)
 *   cells 8-16  serial              R R R 2 6 2 0 6 6   (typed per card, 9 chars)
 */

export const SERIAL_LENGTH = 9;
export const CELL_COUNT = 16;

const SERIAL_PATTERN = /^[A-Z0-9]{9}$/;

export type UpdSides = { front: boolean; side: boolean; rear: boolean };

/** Builds the UPD type code in the order used by the reference card: S/R/F. */
export function buildUpdType({ front, side, rear }: UpdSides): string {
  return [side && "S", rear && "R", front && "F"].filter(Boolean).join("/");
}

export function parseUpdType(updType: string): UpdSides {
  const parts = updType.toUpperCase().split("/");
  return { front: parts.includes("F"), side: parts.includes("S"), rear: parts.includes("R") };
}

export function isValidUpdType(updType: string): boolean {
  return /^[SRF](\/[SRF]){0,2}$/.test(updType) && new Set(updType.split("/")).size === updType.split("/").length;
}

export function normalizeSerial(suffix: string): string {
  return suffix.trim().toUpperCase();
}

export function isValidSerial(suffix: string): boolean {
  return SERIAL_PATTERN.test(normalizeSerial(suffix));
}

/** "KSA" + manufacturer code, i.e. cells 1-6. */
export function buildCountryManufacturerPrefix(countryCode: string, manufacturerCode: string): string {
  return `${countryCode}${manufacturerCode}`.toUpperCase();
}

export type UnderRunNumber = {
  /** Concatenated value stored in `under_run_number_full`, e.g. "KSAE30S/R/FRRR262066". */
  full: string;
  /** Cells 1-7, stored in `under_run_number_prefix`, e.g. "KSAE30S/R/F". */
  prefix: string;
  /** Cells 8-16, stored in `under_run_number_suffix`, e.g. "RRR262066". */
  suffix: string;
  /** Exactly 16 entries, one per printed grid cell. */
  cells: string[];
};

/**
 * @param prefix  cells 1-6: country code + manufacturer code, e.g. "KSAE30"
 * @param type    cell 7: UPD type, e.g. "S/R/F"
 * @param suffix  cells 8-16: the 9-character serial, e.g. "RRR262066"
 */
export function buildUnderRunNumber(prefix: string, type: string, suffix: string): UnderRunNumber {
  const fixedCells = prefix.toUpperCase().split("");
  if (fixedCells.length !== 6) {
    throw new Error(`Under-run prefix must be exactly 6 characters (country + manufacturer code), got "${prefix}"`);
  }
  const serial = normalizeSerial(suffix);
  if (!isValidSerial(serial)) {
    throw new Error(`Serial must be exactly ${SERIAL_LENGTH} letters/digits, got "${suffix}"`);
  }
  const updType = type.toUpperCase();
  const cells = [...fixedCells, updType, ...serial.split("")];
  return {
    full: cells.join(""),
    prefix: fixedCells.join("") + updType,
    suffix: serial,
    cells,
  };
}

/**
 * Human-friendly grouping for display outside the card, in the style of the
 * reference verification page: "KSA E30 S/R/F RRR 262066".
 */
export function formatUnderRunNumberForDisplay(prefix: string, updType: string, suffix: string): string {
  return [prefix.slice(0, 3), prefix.slice(3, 6), updType, suffix.slice(0, 3), suffix.slice(3)].join(" ");
}

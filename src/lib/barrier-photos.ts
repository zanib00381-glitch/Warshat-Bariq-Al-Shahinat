/**
 * Barrier pictures (side / rear). Shared by client and server: which pictures a
 * card can have, the accepted formats, and which URL to show (uploaded or default).
 */
import { COMPANY } from "@/config/company";
import type { PublicCard } from "./cards";

export const PHOTO_KINDS = ["side", "rear"] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

/** Upload limit per picture (the browser shrinks photos well below this first). */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const PHOTO_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** UPD type letter for each picture: a side picture only makes sense with a side barrier (S), etc. */
const LETTER: Record<PhotoKind, string> = { side: "S", rear: "R" };

export function photoKindsFor(updType: string): PhotoKind[] {
  const parts = updType.split("/");
  return PHOTO_KINDS.filter((kind) => parts.includes(LETTER[kind]));
}

/** The picture to display: the card's uploaded one, or the configured default. */
export function barrierPhoto(card: Pick<PublicCard, "side_photo_url" | "rear_photo_url">, kind: PhotoKind) {
  const uploaded = kind === "side" ? card.side_photo_url : card.rear_photo_url;
  return uploaded ? { url: uploaded, isDefault: false } : { url: COMPANY.default_barrier_photos[kind], isDefault: true };
}

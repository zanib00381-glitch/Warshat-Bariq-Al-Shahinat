import "server-only";
import { customAlphabet } from "nanoid";
import { MAX_PHOTO_BYTES, PHOTO_EXTENSIONS, type PhotoKind } from "./barrier-photos";
import { isSupabaseDataConfigured } from "./card-store";
import { getSupabaseAdmin } from "./supabase-server";

const BUCKET = "barrier-photos";
const folderId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

/** Checks the file really is a JPEG/PNG/WEBP (by its first bytes, not just its declared type). */
export async function isAcceptablePhoto(file: File): Promise<boolean> {
  if (!PHOTO_EXTENSIONS[file.type] || file.size === 0 || file.size > MAX_PHOTO_BYTES) return false;
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (file.type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.type === "image/png") return b[0] === 0x89 && ascii(1, 4) === "PNG";
  return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

export type StoredPhotos = { urls: Partial<Record<PhotoKind, string>>; cleanup: () => Promise<void> };

/**
 * Stores the pictures before the card row is written, under a random folder, and
 * returns their public URLs plus a cleanup to call if the card can't be saved.
 * With Supabase: the public `barrier-photos` bucket. Local dev mode: data URLs.
 */
export async function storeBarrierPhotos(photos: Partial<Record<PhotoKind, File>>): Promise<StoredPhotos> {
  const entries = Object.entries(photos) as [PhotoKind, File][];
  if (entries.length === 0) return { urls: {}, cleanup: async () => {} };

  if (!isSupabaseDataConfigured()) {
    const urls: Partial<Record<PhotoKind, string>> = {};
    for (const [kind, file] of entries) {
      urls[kind] = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    }
    return { urls, cleanup: async () => {} };
  }

  const storage = getSupabaseAdmin().storage.from(BUCKET);
  const folder = folderId();
  const paths: string[] = [];
  const urls: Partial<Record<PhotoKind, string>> = {};
  const cleanup = async () => {
    if (paths.length > 0) await storage.remove(paths).catch(() => undefined);
  };

  try {
    for (const [kind, file] of entries) {
      const path = `${folder}/${kind}.${PHOTO_EXTENSIONS[file.type]}`;
      const { error } = await storage.upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
      if (error) throw error;
      paths.push(path);
      urls[kind] = storage.getPublicUrl(path).data.publicUrl;
    }
  } catch (err) {
    await cleanup();
    throw err;
  }
  return { urls, cleanup };
}

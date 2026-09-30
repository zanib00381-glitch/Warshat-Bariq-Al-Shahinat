import type { NextRequest } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { photoKindsFor, PHOTO_KINDS, type PhotoKind } from "@/lib/barrier-photos";
import { getCardStore } from "@/lib/card-store";
import { normalizeCardInput, validateCardInput, type CardField } from "@/lib/card-validation";
import { generateCardId, generateCardNumber, todayInRiyadh, verificationUrl, type CardErrorCode } from "@/lib/cards";
import { isAcceptablePhoto, storeBarrierPhotos } from "@/lib/photo-storage";
import { qrSvgFor } from "@/lib/qr";
import { buildCountryManufacturerPrefix, buildUnderRunNumber } from "@/lib/under-run-number";
import { COMPANY } from "@/config/company";

function fail(code: CardErrorCode, status: number, field?: CardField | `${PhotoKind}_photo`) {
  return Response.json({ error: code, field }, { status });
}

/**
 * The public base URL encoded into QR codes. Required in production: falling back
 * to the request's own origin there could bake a temporary preview-deployment URL
 * into printed cards. Locally, the request origin is fine.
 */
function siteOrigin(request: NextRequest): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : request.nextUrl.origin;
}

/** Admin-only: issues a new card. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("UNAUTHORIZED", 403);
  const admin = await getAdmin();
  if (!admin) return fail("UNAUTHORIZED", 401);

  // multipart/form-data: a "card" JSON field plus optional "side_photo" / "rear_photo"
  // files. Plain JSON (no pictures) is accepted too.
  let body: Record<string, unknown>;
  const photos: Partial<Record<PhotoKind, File>> = {};
  try {
    if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await request.formData();
      body = JSON.parse(String(form.get("card") ?? "{}"));
      for (const kind of PHOTO_KINDS) {
        const file = form.get(`${kind}_photo`);
        if (file instanceof File && file.size > 0) photos[kind] = file;
      }
    } else {
      body = await request.json();
    }
  } catch {
    return fail("MISSING_FIELDS", 400);
  }

  const input = normalizeCardInput({
    // Manufacturer fields default to the company config when left out.
    manufacturer_name: COMPANY.name_ar,
    manufacturer_code: COMPANY.manufacturer_code,
    country_of_origin: COMPANY.country_of_origin_ar,
    card_issue_date: todayInRiyadh(),
    ...body,
  });
  const errors = Object.entries(validateCardInput(input)) as [CardField, CardErrorCode][];
  if (errors.length > 0) {
    const [field, code] = errors[0];
    return Response.json({ error: code, field, fieldErrors: Object.fromEntries(errors) }, { status: 400 });
  }

  // Keep only pictures that match the chosen barrier types, and check they're real images.
  const allowedKinds = photoKindsFor(input.upd_type);
  for (const kind of PHOTO_KINDS) {
    if (!photos[kind]) continue;
    if (!allowedKinds.includes(kind)) delete photos[kind];
    else if (!(await isAcceptablePhoto(photos[kind]))) return fail("INVALID_PHOTO", 400, `${kind}_photo`);
  }

  const number = buildUnderRunNumber(
    buildCountryManufacturerPrefix(COMPANY.country_code, input.manufacturer_code),
    input.upd_type,
    input.under_run_number_suffix,
  );

  try {
    const store = getCardStore();
    if (await store.numberExists(number.full)) return fail("DUPLICATE_NUMBER", 409, "under_run_number_suffix");

    const origin = siteOrigin(request);
    if (!origin) {
      console.error("POST /api/cards: NEXT_PUBLIC_SITE_URL is not set — refusing to issue cards with an unknown QR domain");
      return fail("CONFIG_ERROR", 500);
    }

    // Pictures are stored first; if the card then can't be saved they're deleted again.
    const stored = await storeBarrierPhotos(photos);

    // Retry when a random id or card number happens to collide with an existing one.
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = generateCardId();
      const qrUrl = verificationUrl(origin, id);
      const result = await store.insert({
        id,
        card_number: generateCardNumber(),
        ...input,
        under_run_number_full: number.full,
        under_run_number_prefix: number.prefix,
        under_run_number_suffix: number.suffix,
        qr_url: qrUrl,
        side_photo_url: stored.urls.side ?? null,
        rear_photo_url: stored.urls.rear ?? null,
        created_by: admin.email,
      });

      if (result.ok) {
        return Response.json({ card: result.card, qr_svg: await qrSvgFor(qrUrl) }, { status: 201 });
      }
      if (result.conflict === "number") {
        await stored.cleanup();
        return fail("DUPLICATE_NUMBER", 409, "under_run_number_suffix"); // lost a race with another insert
      }
    }
    await stored.cleanup();
    throw new Error("Could not allocate a unique card id / card number");
  } catch (err) {
    console.error("POST /api/cards failed:", err);
    return fail("SERVER_ERROR", 500);
  }
}

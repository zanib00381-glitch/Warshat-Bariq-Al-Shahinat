import type { NextRequest } from "next/server";
import { getAdmin, isSameOrigin } from "@/lib/auth";
import { getCardStore } from "@/lib/card-store";
import { normalizeCardInput, validateCardInput, type CardField } from "@/lib/card-validation";
import { generateCardId, todayInRiyadh, verificationUrl, type CardErrorCode } from "@/lib/cards";
import { qrSvgFor } from "@/lib/qr";
import { buildCountryManufacturerPrefix, buildUnderRunNumber } from "@/lib/under-run-number";
import { COMPANY } from "@/config/company";

function fail(code: CardErrorCode, status: number, field?: CardField) {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
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

    // Retry on the (astronomically unlikely) event of an ID collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = generateCardId();
      const qrUrl = verificationUrl(origin, id);
      const result = await store.insert({
        id,
        ...input,
        under_run_number_full: number.full,
        under_run_number_prefix: number.prefix,
        under_run_number_suffix: number.suffix,
        qr_url: qrUrl,
        created_by: admin.email,
      });

      if (result.ok) {
        return Response.json({ card: result.card, qr_svg: await qrSvgFor(qrUrl) }, { status: 201 });
      }
      if (result.conflict === "number") {
        return fail("DUPLICATE_NUMBER", 409, "under_run_number_suffix"); // lost a race with another insert
      }
    }
    throw new Error("Could not allocate a unique card id");
  } catch (err) {
    console.error("POST /api/cards failed:", err);
    return fail("SERVER_ERROR", 500);
  }
}

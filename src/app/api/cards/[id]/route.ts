import type { NextRequest } from "next/server";
import type { CardErrorCode } from "@/lib/cards";
import { getPublicCard } from "@/lib/public-cards";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const RATE_LIMIT = 60; // requests per IP per window
const RATE_WINDOW_MS = 60_000;

function fail(code: CardErrorCode | "RATE_LIMITED", status: number, headers?: HeadersInit) {
  return Response.json({ error: code }, { status, headers });
}

/** Public: returns a single card by its public id. Never includes internal fields. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/cards/[id]">) {
  const limited = rateLimit(`card-get:${clientIp(request.headers)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limited.ok) {
    return fail("RATE_LIMITED", 429, { "Retry-After": String(limited.retryAfterSeconds) });
  }

  const { id } = await ctx.params;
  try {
    const card = await getPublicCard(id);
    if (!card) return fail("NOT_FOUND", 404, { "Cache-Control": "public, max-age=10" });

    // Issued cards never change, so browsers and CDNs may cache them.
    return Response.json(
      { card },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error(`GET /api/cards/${id} failed:`, err);
    return fail("SERVER_ERROR", 500);
  }
}

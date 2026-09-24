import "server-only";
import { getCardStore } from "./card-store";
import { CARD_ID_PATTERN, toPublicCard, type PublicCard } from "./cards";

/**
 * Read path for the public verification page and GET /api/cards/[id].
 *
 * Cards are never edited after issue, so a short in-memory cache is safe and
 * absorbs repeated scans of the same QR code. Misses are cached briefly too, so
 * hammering random ids can't turn into a stream of database queries.
 * (Per server instance — on serverless hosting each instance has its own cache.)
 * TODO(Phase 4): if cards can be revoked, clear the entry on revoke.
 */
const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 10_000;
const MAX_ENTRIES = 1_000;

const cache = new Map<string, { card: PublicCard | null; expires: number }>();

export async function getPublicCard(id: string): Promise<PublicCard | null> {
  if (!CARD_ID_PATTERN.test(id)) return null;

  const now = Date.now();
  const cached = cache.get(id);
  if (cached && cached.expires > now) return cached.card;

  const found = await getCardStore().getById(id);
  const card = found ? toPublicCard(found) : null;

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!); // drop the oldest entry
  cache.set(id, { card, expires: now + (card ? HIT_TTL_MS : MISS_TTL_MS) });
  return card;
}

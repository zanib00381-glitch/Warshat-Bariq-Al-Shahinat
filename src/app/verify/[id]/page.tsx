import type { Metadata } from "next";
import { COMPANY } from "@/config/company";
import { getPublicCard } from "@/lib/public-cards";
import { qrSvgFor } from "@/lib/qr";
import { CardNotVerified } from "./CardNotVerified";
import { VerifyView } from "./VerifyView";

export const metadata: Metadata = {
  title: `UPD card verification | ${COMPANY.name_en}`,
  robots: { index: false, follow: false },
};

/**
 * Public verification page opened by scanning a card's QR code. No login.
 *
 * Reads through the same `getPublicCard()` used by GET /api/cards/[id] (shared
 * cache, public fields only) instead of calling the API over HTTP from the server.
 * - Unknown id       → red "could not be verified" verdict
 * - Database failure → error.tsx (neutral "try again" — never shown as a fake card)
 *
 * Both verdicts are rendered directly here so they're complete in the server
 * HTML — visible instantly, without JavaScript, and in link previews. (In this
 * Next.js version a segment-level notFound() only rendered client-side in
 * production builds, so it isn't used. There's also deliberately no loading.tsx:
 * streaming would deliver the verdict via JavaScript too.) The page is noindex.
 */
export default async function VerifyPage({ params }: PageProps<"/verify/[id]">) {
  const { id } = await params;
  const card = await getPublicCard(id);
  if (!card) return <CardNotVerified />;

  return <VerifyView card={card} qrSvg={await qrSvgFor(card.qr_url)} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { getCardStore } from "@/lib/card-store";
import { CARD_ID_PATTERN } from "@/lib/cards";
import { qrSvgFor } from "@/lib/qr";
import { CardPreview } from "./CardPreview";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Admin preview of a generated card, with copy-link / PDF / print actions. */
export default async function CardPreviewPage({ params, searchParams }: PageProps<"/cards/[id]/preview">) {
  const { id } = await params;
  await requireAdminPage(`/cards/${id}/preview`);
  const { created } = await searchParams;
  if (!CARD_ID_PATTERN.test(id)) notFound();

  const card = await getCardStore().getById(id);
  if (!card) notFound();

  return <CardPreview card={card} qrSvg={await qrSvgFor(card.qr_url)} justCreated={created === "1"} />;
}

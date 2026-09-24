import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { getCardStore } from "@/lib/card-store";
import { toPublicCard } from "@/lib/cards";
import { CardsTable } from "./CardsTable";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Always read fresh data — a newly issued card must show up immediately.
export const dynamic = "force-dynamic";

/** Admin list of all issued cards, newest first. */
export default async function CardsPage() {
  await requireAdminPage("/admin/cards");
  const cards = (await getCardStore().list()).map(toPublicCard);
  return <CardsTable cards={cards} />;
}

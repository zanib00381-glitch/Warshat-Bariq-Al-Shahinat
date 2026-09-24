import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { NewCardView } from "./NewCardView";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Auth-gated: must be decided per request, never prerendered at build time.
export const dynamic = "force-dynamic";

/** Admin home: the new-card form. */
export default async function HomePage() {
  await requireAdminPage("/");
  return <NewCardView />;
}

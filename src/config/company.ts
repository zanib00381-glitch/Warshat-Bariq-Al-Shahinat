/**
 * Company configuration — the single source of truth for company details.
 * Update values here and they propagate to the header, footer, new cards,
 * and the verification page. Existing cards keep the values stored with them.
 */
export const COMPANY = {
  name_en: "Warshat Bariq Al-Shahinat",
  name_ar: "ورشة بريق الشاحنات",
  manufacturer_code: "E30",
  country_code: "KSA",
  country_of_origin_ar: "السعودية",
  country_of_origin_en: "Saudi Arabia",
  logo_path: "/logo.png",
  // Downscaled copy of the same logo embedded in the card (keeps PDFs small).
  logo_card_path: "/logo-card.png",
  // Not present in the reference PDF — fill in, e.g. ["+966 11 000 0000", "+966 50 000 0000"].
  contact_phones: [] as string[],
  // Shown in the "Company" section of the public verification page.
  // ⚠ Make sure this is YOUR workshop's address.
  address_en: "Building 3350, 47725, Saudi Arabia",
  address_ar: "مبنى 3350، 47725، المملكة العربية السعودية",
  applicant_type: { en: "Factory", ar: "مصنع", ur: "فیکٹری" },
  // Shown when a card has no uploaded barrier picture. Replace these files (or
  // point to your own photos in /public) to change the default pictures.
  default_barrier_photos: {
    side: "/barriers/side-default.svg",
    rear: "/barriers/rear-default.svg",
  },
} as const;

export type CompanyConfig = typeof COMPANY;

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
  // Not present in the reference PDF — fill in, e.g. ["+966 11 000 0000", "+966 50 000 0000"].
  contact_phones: [] as string[],
  // Shown in the footer of the public record page (empty = not shown).
  contact_fax: "",
  contact_email: "",
  // Shown when a card has no uploaded barrier picture. Replace these files (or
  // point to your own photos in /public) to change the default pictures.
  default_barrier_photos: {
    side: "/barriers/side-default.svg",
    rear: "/barriers/rear-default.svg",
  },
} as const;

export type CompanyConfig = typeof COMPANY;

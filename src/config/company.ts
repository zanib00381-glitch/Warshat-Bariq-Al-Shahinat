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
  // Public record page (what a scanned QR code opens): header name, footer contacts
  // and footer texts, as in the client's reference page. Empty contact = row hidden.
  // ⚠ The contact details below are the placeholders from the reference page —
  //   replace them with real ones before handing cards to customers.
  record_page: {
    brand: "سجل هتان",
    brand_en: "Hattan Registry",
    legal: "© سجل هتان التجريبي",
    phone: "+966 00 000 0000",
    fax: "+966 00 000 0001",
    email: "support@hattan-registry.example",
  },
  // Shown when a card has no uploaded barrier picture. Replace these files (or
  // point to your own photos in /public) to change the default pictures.
  default_barrier_photos: {
    side: "/barriers/side-default.svg",
    rear: "/barriers/rear-default.svg",
  },
} as const;

/** Switches for features that are built but turned off for now. */
export const FEATURES = {
  // Side/rear barrier picture uploads in the new-card form (and their display on
  // the admin preview). Set to true to bring them back; the database already supports them.
  barrierPhotos: false,
} as const;

export type CompanyConfig = typeof COMPANY;

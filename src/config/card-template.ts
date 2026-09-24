/**
 * Fixed text of the official bilingual (Arabic + English) UPD card, copied from
 * the reference PDF `CargoBarriersCard (286).pdf`.
 *
 * This is a regulatory document format. It must NOT be translated or read from
 * the app's i18n dictionaries — the Arabic/Urdu UI toggle never affects the card.
 * "\n" marks the line breaks exactly where the reference PDF breaks each label.
 */
export const CARD_TEXT = {
  title_ar: "بطاقة الرقم المميز للحاجز",
  title_en: "Unique Under-run Protection Device UPD Card",
  manufacturer_section_en: "UPD Manufacturer's Information /",
  manufacturer_section_ar: "معلومات مصنّع الحاجز",
  vehicle_section_en: "Vehicle (Truck/trailer) Information -",
  vehicle_section_ar: "بيانات المركبة (الشاحنة/المقطورة)",
  rows: {
    manufacturer_name: { en: "Manufacturer's Name:", ar: "اسم المصنع/الورشة" },
    manufacturer_code: { en: "Manufacturer Assigned\nCode:", ar: "رمز المنشأة" },
    country_of_origin: { en: "Country of Origin:", ar: "بلد المنشأة" },
    date_of_manufacture: { en: "Date of Manufacture:", ar: "تاريخ الصنع" },
    technical_references: { en: "Technical References:", ar: "المتطلبات الفنية" },
    vehicle_model_name: { en: "Vehicle Model Name:", ar: "اسم طراز المركبة" },
    vehicle_brand: { en: "Vehicle Brand:", ar: "ماركة المركبة" },
    vehicle_model_year: { en: "Vehicle Model Year:", ar: "سنة موديل المركبة" },
    upd_type: { en: "UPD Type (Front, Side,\nRear):", ar: "نوع الحاجز (أمامي، جانبي،\nخلفي)" },
    vehicle_chassis_number: { en: "Vehicle Chassis\nNumber (VIN):", ar: "رقم هيكل المركبة (VIN)" },
    under_run_number: { en: "Distinguished\nUnder-Run\nNumber:", ar: "الرقم المميز للحاجز" },
    card_issue_date: { en: "Card's issue date:", ar: "تاريخ إصدار البطاقة" },
  },
  footer_en: [
    "This is an electronic card and does not require a stamp and signature. Please scan the QR code to verify this card.",
    "Any changes or modification on this card will affect its validity.",
  ],
  footer_ar: [
    "هذه البطاقة صدرت إلكترونياً ولا تحتاج إلى ختم أو توقيع للتأكد من صحة البطاقة، الرجاء مسح رمز الاستجابة السريعة للتأكد من بيانات البطاقة.",
    "أي كشط أو تغيير في هذه البطاقة يلغي صلاحيتها.",
  ],
} as const;

/** Default value of the "Technical References" row, as printed in the reference PDF. */
export const DEFAULT_TECHNICAL_REFERENCES =
  "اللائحة الفنية للحواجز الأمامية والخلفية والجانبية للشاحنات والمقطورات";

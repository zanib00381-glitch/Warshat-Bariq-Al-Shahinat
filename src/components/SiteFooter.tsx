"use client";

import { COMPANY } from "@/config/company";
import { useLanguage } from "@/i18n/LanguageProvider";

export function SiteFooter() {
  const { t, language } = useLanguage();

  return (
    <footer className="mt-auto border-t border-brand/15 bg-white text-sm text-slate-600 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4">
        <span>
          © {new Date().getFullYear()} {language === "en" ? COMPANY.name_en : <span lang="ar">{COMPANY.name_ar}</span>} — {t("footer.rights")}
        </span>
        {COMPANY.contact_phones.length > 0 && (
          <span>
            {t("footer.contact")}:{" "}
            {COMPANY.contact_phones.map((phone) => (
              <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} dir="ltr" className="ms-2 hover:text-brand">
                {phone}
              </a>
            ))}
          </span>
        )}
      </div>
    </footer>
  );
}

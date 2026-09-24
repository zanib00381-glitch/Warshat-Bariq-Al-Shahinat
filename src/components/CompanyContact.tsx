"use client";

import Image from "next/image";
import { COMPANY } from "@/config/company";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Issuer identity + contact details, shown on the public verification pages. */
export function CompanyContact() {
  const { t } = useLanguage();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-500">{t("verify.contactTitle")}</h2>
      <div className="flex items-center gap-3">
        <Image src={COMPANY.logo_path} alt="" width={72} height={48} className="h-12 w-auto" />
        <div className="leading-tight">
          <div lang="ar" className="font-bold text-brand">
            {COMPANY.name_ar}
          </div>
          <div className="font-sans text-sm text-slate-500">
            <span dir="ltr">{COMPANY.name_en}</span>
          </div>
        </div>
      </div>
      {COMPANY.contact_phones.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {COMPANY.contact_phones.map((phone) => (
            <li key={phone}>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                dir="ltr"
                className="inline-block rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand"
              >
                📞 {phone}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

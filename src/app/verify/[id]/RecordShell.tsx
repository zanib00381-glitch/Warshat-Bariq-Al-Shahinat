import { COMPANY } from "@/config/company";
import s from "./RecordPage.module.css";

/**
 * Fixed Arabic text of the public record page (the client's reference page is
 * Arabic-only, so this page deliberately does not follow the UI language switch).
 */
export const RECORD_TEXT = {
  title: "نظام سجلات المركبات",
  subtitle: "بطاقة الرقم المميز لحواجز الشاحنات والمقطورات",
  madeOn: "تاريخ صنع الحاجز",
  fields: {
    barrierNo: "الرقم المميز للحاجز",
    vehicleType: "نوع المركبة",
    vin: "رقم الهيكل للمركبة",
    brand: "ماركة المركبة",
    model: "اسم طراز المركبة",
    modelYear: "سنة موديل المركبة",
  },
  feedback: "إرسال ملاحظة على السجل",
  faq: "الأسئلة الشائعة",
  notVerifiedTitle: "تعذّر التحقق من هذه البطاقة",
  notVerifiedDesc: "لم يتم العثور على بطاقة بهذا الرمز. قد تكون البطاقة مزوّرة أو الرابط غير صحيح، فلا تعتمد عليها.",
  errorTitle: "تعذّر الاتصال بالخادم",
  errorDesc: "لم نتمكن من التحقق من البطاقة حالياً. هذا لا يعني أن البطاقة غير صالحة، يرجى المحاولة مرة أخرى بعد قليل.",
  retry: "إعادة المحاولة",
} as const;

/** Page frame: header (mark + name + titles), the given content, and the contact footer. */
export function RecordShell({ children, feedbackSubject }: { children: React.ReactNode; feedbackSubject?: string }) {
  const page = COMPANY.record_page;
  const subject = encodeURIComponent(`${RECORD_TEXT.feedback}${feedbackSubject ? ` — ${feedbackSubject}` : ""}`);
  const feedbackHref = page.email
    ? `mailto:${page.email}?subject=${subject}`
    : page.phone
      ? `tel:${page.phone.replace(/\s/g, "")}`
      : null;

  return (
    <main className={s.page}>
      <div className={s.sheet} dir="rtl" lang="ar">
        <header className={s.header}>
          <div className={s.brand}>
            <span className={s.mark} aria-hidden>
              <i />
              <b />
            </span>
            <span>{page.brand}</span>
          </div>
          <h1 className={s.title}>{RECORD_TEXT.title}</h1>
          <p className={s.subtitle}>{RECORD_TEXT.subtitle}</p>
        </header>

        {children}

        <footer className={s.footer}>
          <ul className={s.contacts}>
            {page.phone && (
              <li>
                <span className={s.icon}>
                  <PhoneIcon />
                </span>
                <a href={`tel:${page.phone.replace(/\s/g, "")}`}>
                  <bdi>{page.phone}</bdi>
                </a>
              </li>
            )}
            {page.fax && (
              <li>
                <span className={s.icon}>
                  <FaxIcon />
                </span>
                <bdi>{page.fax}</bdi>
              </li>
            )}
            {page.email && (
              <li>
                <span className={s.icon}>
                  <MailIcon />
                </span>
                <a href={`mailto:${page.email}`}>
                  <bdi>{page.email}</bdi>
                </a>
              </li>
            )}
          </ul>
          {feedbackHref ? (
            <a className={s.action} href={feedbackHref}>
              {RECORD_TEXT.feedback} <ClipboardIcon />
            </a>
          ) : (
            <button type="button" className={s.action}>
              {RECORD_TEXT.feedback} <ClipboardIcon />
            </button>
          )}
          <div className={s.legal}>
            {page.legal} {new Date().getFullYear()}
          </div>
          <div className={s.bottom}>
            <span>{RECORD_TEXT.faq}</span>
            <span className={s.divider}>|</span>
            <span dir="ltr">{page.brand_en}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

const iconProps = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

function PhoneIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1Z" />
    </svg>
  );
}

function FaxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 3h10v4H7zM5 8h14a3 3 0 0 1 3 3v6h-3v4H5v-4H2v-6a3 3 0 0 1 3-3Zm2 7v4h10v-4zm11-4.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.2L4.3 7H4v.8l8 5.4 8-5.4V7h-.3Z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1Zm1 2v2h4V4Zm5.3 6.3-4.3 4.3-2.3-2.3-1.4 1.4 3.7 3.7 5.7-5.7Z" />
    </svg>
  );
}

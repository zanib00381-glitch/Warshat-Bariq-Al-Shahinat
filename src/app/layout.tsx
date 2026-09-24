import type { Metadata } from "next";
import { Noto_Nastaliq_Urdu, Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import { COMPANY } from "@/config/company";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, directionOf, isLanguage } from "@/i18n/languages";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
});

// Noto Sans: the English UI font, and the Latin font of the official card (as in the reference PDF).
const notoSans = Noto_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Urdu readers expect Nastaliq; applied only when the UI language is Urdu.
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  // Default tab title (English, the default UI language); <PageTitle> localizes it per page.
  title: `UPD Card System | ${COMPANY.name_en}`,
  description: `${COMPANY.name_en} — issuing and verifying Unique Under-run Protection Device (UPD) cards`,
  icons: { icon: COMPANY.logo_path },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The visitor's UI language (cookie mirrored from localStorage), so the server
  // renders the right text and direction on the first paint: English LTR, Arabic/Urdu RTL.
  const saved = (await cookies()).get(LANGUAGE_STORAGE_KEY)?.value;
  const language = isLanguage(saved) ? saved : DEFAULT_LANGUAGE;

  return (
    <html
      lang={language}
      dir={directionOf(language)}
      suppressHydrationWarning
      className={`${notoSans.variable} ${notoSansArabic.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <LanguageProvider initialLanguage={language}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}

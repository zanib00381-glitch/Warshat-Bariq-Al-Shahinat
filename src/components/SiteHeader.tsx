"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { COMPANY } from "@/config/company";
import { useLanguage } from "@/i18n/LanguageProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Spinner } from "./Spinner";

// Logout only makes sense once Supabase Auth is configured (not in local dev mode).
const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function SiteHeader() {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Only real admin routes get the admin nav + logout (not /verify, /login or unknown URLs).
  const isAdmin = pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/cards/");

  const navLinks = [
    { href: "/", label: t("nav.newCard") },
    { href: "/admin/cards", label: t("nav.cards") },
  ];

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="border-b border-brand/15 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={isAdmin ? "/" : pathname} className="flex items-center gap-3">
          <Image src={COMPANY.logo_path} alt={COMPANY.name_en} width={72} height={48} priority className="h-12 w-auto" />
          <div className="leading-tight">
            {language === "en" ? (
              <div className="font-bold text-brand">{COMPANY.name_en}</div>
            ) : (
              <div lang="ar" className="font-bold text-brand">
                {COMPANY.name_ar}
              </div>
            )}
            <div className="text-xs text-slate-500">{t("app.title")}</div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {isAdmin && (
            <nav className="flex gap-1 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 font-medium ${
                    pathname === link.href ? "bg-brand/10 text-brand" : "text-slate-600 hover:text-brand"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          <LanguageSwitcher />
          {isAdmin && AUTH_ENABLED && (
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-red-400 hover:text-red-600 disabled:opacity-60"
            >
              {loggingOut && <Spinner className="h-3.5 w-3.5" />}
              {t("auth.logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

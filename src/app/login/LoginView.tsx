"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Spinner } from "@/components/Spinner";
import { COMPANY } from "@/config/company";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";
import type { LoginErrorCode } from "@/app/api/auth/login/route";

const LOGIN_ERRORS: Record<LoginErrorCode | "NETWORK", TranslationKey> = {
  MISSING_FIELDS: "auth.missingFields",
  INVALID_CREDENTIALS: "auth.invalidCredentials",
  EMAIL_NOT_CONFIRMED: "auth.emailNotConfirmed",
  NOT_ADMIN: "auth.notAdmin",
  RATE_LIMITED: "auth.tooManyAttempts",
  AUTH_NOT_CONFIGURED: "messages.configError",
  SERVER_ERROR: "messages.genericError",
  NETWORK: "messages.networkError",
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export function LoginView({ nextPath, devMode }: { nextPath: string; devMode: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("auth.missingFields");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace(nextPath);
        router.refresh();
        return; // keep the spinner until the next page renders
      }
      const body: { error?: LoginErrorCode } = await res.json().catch(() => ({}));
      setError(LOGIN_ERRORS[body.error ?? "SERVER_ERROR"] ?? "messages.genericError");
    } catch {
      setError(LOGIN_ERRORS.NETWORK);
    }
    setSubmitting(false);
  }

  return (
    <main className="flex w-full flex-1 items-start justify-center px-4 py-10 sm:items-center">
      <PageTitle titleKey="auth.loginTitle" />
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src={COMPANY.logo_path} alt={COMPANY.name_en} width={150} height={100} priority className="h-24 w-auto" />
          <h1 className="mt-3 text-xl font-bold text-brand">{t("auth.loginTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.loginSubtitle")}</p>
        </div>

        {devMode ? (
          <div className="space-y-4">
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{t("auth.devModeNotice")}</p>
            <Link href={nextPath} className="block rounded-md bg-brand px-4 py-2.5 text-center font-semibold text-white">
              {t("auth.continue")}
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700">
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="username"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} text-left rtl:text-right`}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700">
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} text-left rtl:text-right`}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-red-50 p-2.5 text-sm font-medium text-red-700">
                {t(error)}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand/90 disabled:opacity-70"
            >
              {submitting && <Spinner />}
              {submitting ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

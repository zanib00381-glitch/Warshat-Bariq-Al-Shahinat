import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isDevLocalMode, safeNextPath } from "@/lib/admin-access";
import { getAdmin } from "@/lib/auth";
import { LoginView } from "./LoginView";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);
  if (!isDevLocalMode() && (await getAdmin())) redirect(nextPath);

  return <LoginView nextPath={nextPath} devMode={isDevLocalMode()} />;
}

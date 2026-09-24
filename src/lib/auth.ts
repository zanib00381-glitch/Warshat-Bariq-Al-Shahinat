import "server-only";
import { redirect } from "next/navigation";
import { DEV_ADMIN, isDevLocalMode, toAdmin, type AdminUser } from "./admin-access";
import { createSupabaseAuthClient, isSupabaseAuthConfigured } from "./supabase-auth";

/**
 * The authoritative admin check. Every admin page and admin API route calls one
 * of these — the proxy only does an early redirect and is not relied on alone.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  if (isDevLocalMode()) return DEV_ADMIN;
  if (!isSupabaseAuthConfigured()) return null; // misconfigured production: fail closed

  const supabase = await createSupabaseAuthClient();
  // getUser() validates the session with Supabase Auth (not just the cookie contents).
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return toAdmin(data.user);
}

/** For admin pages: returns the admin, or redirects to /login and back afterwards. */
export async function requireAdminPage(currentPath: string): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  return admin;
}

/**
 * For state-changing API routes: rejects cross-site requests. Session cookies are
 * SameSite=Lax already; this is a second, explicit CSRF guard.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers / non-browser clients
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

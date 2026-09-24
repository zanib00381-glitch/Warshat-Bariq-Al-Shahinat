/**
 * Who counts as an admin. Kept free of Next/server imports so both the proxy and
 * server code can use it.
 *
 * A Supabase user is an admin only if their email is listed in ADMIN_EMAILS *and*
 * confirmed. Supabase projects allow public sign-ups by default, so "logged in"
 * alone must never be enough — otherwise anyone could register with the public
 * key and issue cards that verify as genuine. An empty allowlist denies everyone.
 */
export type AdminUser = { id: string; email: string };

type MaybeUser = { id: string; email?: string | null; email_confirmed_at?: string | null } | null | undefined;

export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function toAdmin(user: MaybeUser): AdminUser | null {
  const email = user?.email?.toLowerCase();
  if (!user || !email || !user.email_confirmed_at) return null;
  return adminEmails().has(email) ? { id: user.id, email } : null;
}

/**
 * Local development before Supabase is set up: no login at all (and cards go to
 * .data/cards.json). Only under `next dev` — never in a production build.
 */
export function isDevLocalMode(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export const DEV_ADMIN: AdminUser = { id: "dev-local", email: "dev@localhost" };

/** Only same-site relative paths, so `/login?next=` can't be used as an open redirect. */
export function safeNextPath(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

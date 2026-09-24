import type { NextRequest } from "next/server";
import { toAdmin } from "@/lib/admin-access";
import { isSameOrigin } from "@/lib/auth";
import { clientIp, peekRateLimit, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase-auth";

export type LoginErrorCode =
  | "MISSING_FIELDS"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "NOT_ADMIN"
  | "RATE_LIMITED"
  | "AUTH_NOT_CONFIGURED"
  | "SERVER_ERROR";

const WINDOW_MS = 15 * 60_000;

function fail(error: LoginErrorCode, status: number, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers });
}

/** Email + password login. On success Supabase's session cookies are set on the response. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("SERVER_ERROR", 403);
  if (!isSupabaseAuthConfigured()) return fail("AUTH_NOT_CONFIGURED", 503);

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    // fall through to MISSING_FIELDS
  }
  if (!email || !password) return fail("MISSING_FIELDS", 400);

  // Slow down password guessing (Supabase has its own limits too): all attempts per IP,
  // plus *failed* attempts per account (successful logins don't count). Trade-off:
  // 10 wrong passwords lock that account for up to 15 minutes, whoever sent them.
  const emailKey = `login-email:${email}`;
  for (const limited of [rateLimit(`login-ip:${clientIp(request.headers)}`, 20, WINDOW_MS), peekRateLimit(emailKey, 10)]) {
    if (!limited.ok) return fail("RATE_LIMITED", 429, { "Retry-After": String(limited.retryAfterSeconds) });
  }

  try {
    const supabase = await createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") return fail("EMAIL_NOT_CONFIRMED", 403);
      if (error.status === 400 || error.code === "invalid_credentials") {
        rateLimit(emailKey, 10, WINDOW_MS); // count the failure
        return fail("INVALID_CREDENTIALS", 401);
      }
      if (error.status === 429) return fail("RATE_LIMITED", 429);
      throw error;
    }
    if (!toAdmin(data.user)) {
      await supabase.auth.signOut(); // valid Supabase user, but not on the admin allowlist
      return fail("NOT_ADMIN", 403);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return fail("SERVER_ERROR", 500);
  }
}

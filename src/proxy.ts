import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDevLocalMode, safeNextPath, toAdmin } from "@/lib/admin-access";

/**
 * Runs before admin pages, /login and the auth/card APIs:
 *  1. refreshes the Supabase session cookie (server components can't write cookies);
 *  2. optimistic redirects — non-admins away from admin pages, admins away from /login.
 * This is a convenience layer only: every page/route re-checks with getAdmin().
 * /verify/* is not matched at all and stays fully public.
 */
const ADMIN_PAGES = [/^\/$/, /^\/admin(\/|$)/, /^\/cards(\/|$)/];

export async function proxy(request: NextRequest) {
  if (isDevLocalMode()) return NextResponse.next();

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // pages/routes fail closed on their own

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const admin = toAdmin(data.user);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (target: string) => {
    const res = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c)); // keep refreshed cookies
    return res;
  };

  if (!admin && ADMIN_PAGES.some((re) => re.test(pathname))) {
    return redirectTo(`/login?next=${encodeURIComponent(pathname + search)}`);
  }
  if (admin && pathname === "/login") {
    return redirectTo(safeNextPath(request.nextUrl.searchParams.get("next")));
  }
  return response;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/cards/:path*", "/login", "/api/cards", "/api/auth/:path*"],
};

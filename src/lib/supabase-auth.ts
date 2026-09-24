import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** True when the Supabase project URL + public (anon/publishable) key are set. */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Supabase client bound to the current request's auth cookies (server components,
 * route handlers). Uses the public anon key — it acts *as the logged-in user*,
 * unlike the service-role client in supabase-server.ts. Create one per request.
 */
export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only. The proxy
          // (src/proxy.ts) refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}

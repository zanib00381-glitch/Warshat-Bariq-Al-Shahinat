import type { NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { createSupabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase-auth";

/** Ends the session and clears the auth cookies. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseAuthClient();
    await supabase.auth.signOut();
  }
  return Response.json({ ok: true });
}

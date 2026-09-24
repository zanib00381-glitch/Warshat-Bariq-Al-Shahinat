import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UpdCard } from "./cards";
import { getSupabaseAdmin } from "./supabase-server";

export type NewCard = Omit<UpdCard, "created_at" | "created_by"> & { created_by?: string | null };
export type InsertResult = { ok: true; card: UpdCard } | { ok: false; conflict: "id" | "number" };

/** Persistence for UPD cards. Supabase in real use; a local JSON file as a dev-only fallback. */
export interface CardStore {
  getById(id: string): Promise<UpdCard | null>;
  numberExists(underRunNumberFull: string): Promise<boolean>;
  insert(card: NewCard): Promise<InsertResult>;
  list(): Promise<UpdCard[]>;
}

const supabaseStore: CardStore = {
  async getById(id) {
    const { data, error } = await getSupabaseAdmin().from("upd_cards").select("*").eq("id", id).maybeSingle<UpdCard>();
    if (error) throw error;
    return data;
  },
  async numberExists(full) {
    const { data, error } = await getSupabaseAdmin()
      .from("upd_cards")
      .select("id")
      .eq("under_run_number_full", full)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },
  async insert(card) {
    const { data, error } = await getSupabaseAdmin().from("upd_cards").insert(card).select().single<UpdCard>();
    if (!error) return { ok: true, card: data };
    if (error.code === "23505") {
      // unique_violation — tell apart the under-run number from the primary key
      return { ok: false, conflict: error.message.includes("under_run_number_full") ? "number" : "id" };
    }
    throw error;
  },
  async list() {
    const { data, error } = await getSupabaseAdmin()
      .from("upd_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<UpdCard[]>();
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------------------
// Dev-only fallback so the app runs locally before Supabase is configured.
// Never used in production (see getCardStore).
// ---------------------------------------------------------------------------
const LOCAL_FILE = path.join(process.cwd(), ".data", "cards.json");
let localQueue: Promise<unknown> = Promise.resolve();

async function readLocal(): Promise<UpdCard[]> {
  try {
    return JSON.parse(await readFile(LOCAL_FILE, "utf8"));
  } catch {
    return [];
  }
}

/** Serializes file access so concurrent requests can't clobber each other. */
function withLocalLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = localQueue.then(fn, fn);
  localQueue = run.catch(() => undefined);
  return run;
}

const localFileStore: CardStore = {
  getById: async (id) => (await readLocal()).find((c) => c.id === id) ?? null,
  numberExists: async (full) => (await readLocal()).some((c) => c.under_run_number_full === full),
  insert: (card) =>
    withLocalLock(async () => {
      const cards = await readLocal();
      if (cards.some((c) => c.id === card.id)) return { ok: false, conflict: "id" } as const;
      if (cards.some((c) => c.under_run_number_full === card.under_run_number_full)) {
        return { ok: false, conflict: "number" } as const;
      }
      const saved: UpdCard = { created_by: null, ...card, created_at: new Date().toISOString() };
      await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
      await writeFile(LOCAL_FILE, JSON.stringify([saved, ...cards], null, 2));
      return { ok: true, card: saved } as const;
    }),
  list: readLocal,
};

let warned = false;

export function getCardStore(): CardStore {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (hasSupabase) return supabaseStore;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!warned) {
    console.warn(`[card-store] Supabase env vars missing — using local dev file ${LOCAL_FILE}`);
    warned = true;
  }
  return localFileStore;
}

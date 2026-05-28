import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchCategory, type TmdbCategory, type NormalisedMovie } from "./tmdb.server";

export interface SyncResult {
  ok: boolean;
  totals: Record<TmdbCategory, number>;
  upserted: number;
  error: string | null;
}

const CATEGORIES: TmdbCategory[] = ["now_showing", "coming_soon", "popular"];

/**
 * Fetch the three TMDb lists and upsert into public.movies (conflict on tmdb_id).
 * NOTE: temporarily unauthenticated for Module 2 testing — will be wrapped behind
 * admin auth in Module 4.
 */
export const syncTmdbMovies = createServerFn({ method: "POST" }).handler(
  async (): Promise<SyncResult> => {
    console.log("[sync] starting TMDb sync");
    const totals: Record<TmdbCategory, number> = {
      now_showing: 0,
      coming_soon: 0,
      popular: 0,
    };

    try {
      const all: NormalisedMovie[] = [];
      for (const cat of CATEGORIES) {
        const rows = await fetchCategory(cat);
        totals[cat] = rows.length;
        all.push(...rows);
      }

      // Deduplicate by tmdb_id (a movie may appear in multiple lists — keep first/category preference).
      const byId = new Map<number, NormalisedMovie>();
      for (const m of all) {
        if (!byId.has(m.tmdb_id)) byId.set(m.tmdb_id, m);
      }
      const deduped = Array.from(byId.values());
      console.log(`[sync] upserting ${deduped.length} unique movies`);

      const { error } = await supabaseAdmin
        .from("movies")
        .upsert(
          deduped.map((m) => ({ ...m, synced_at: new Date().toISOString() })),
          { onConflict: "tmdb_id" }
        );

      if (error) {
        console.error("[sync] upsert error:", error);
        return { ok: false, totals, upserted: 0, error: error.message };
      }

      console.log("[sync] done", totals);
      return { ok: true, totals, upserted: deduped.length, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[sync] failed:", msg);
      return { ok: false, totals, upserted: 0, error: msg };
    }
  }
);

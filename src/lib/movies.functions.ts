// Public read server functions for movies.
// Returns rows mapped to the existing `Movie` shape consumed by the UI.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Movie, MovieCategory } from "@/lib/cinema-data";

interface MovieRow {
  id: string;
  title: string;
  poster_url: string | null;
  category: MovieCategory;
  genres: string[] | null;
  duration_minutes: number | null;
  tmdb_popularity: number | null;
}

const MOVIE_COLUMNS =
  "id, title, poster_url, category, genres, duration_minutes, tmdb_popularity";

function mapRow(row: MovieRow): Movie {
  return {
    id: row.id,
    title: row.title,
    posterUrl: row.poster_url ?? "",
    category: row.category,
    genres: row.genres && row.genres.length > 0 ? row.genres : ["Movie"],
    durationMinutes: row.duration_minutes ?? 0,
  };
}

/**
 * Fetch movies grouped by category for the landing page rails.
 * Sorted by tmdb_popularity desc within each bucket.
 */
export const getMoviesByCategoryFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<MovieCategory, Movie[]>> => {
    console.log("[movies] getMoviesByCategoryFn called");
    const { data, error } = await supabaseAdmin
      .from("movies")
      .select(MOVIE_COLUMNS)
      .order("tmdb_popularity", { ascending: false, nullsFirst: false })
      .limit(200);

    if (error) {
      console.error("[movies] getMoviesByCategoryFn error:", error);
      throw new Error(error.message);
    }

    const rows = (data ?? []) as MovieRow[];
    const result: Record<MovieCategory, Movie[]> = {
      now_showing: [],
      coming_soon: [],
      popular: [],
    };
    for (const row of rows) {
      const bucket = result[row.category];
      if (bucket) bucket.push(mapRow(row));
    }
    console.log(
      `[movies] returning now_showing=${result.now_showing.length} coming_soon=${result.coming_soon.length} popular=${result.popular.length}`,
    );
    return result;
  },
);

const getMoviesByIdsInput = z.object({
  ids: z.array(z.string().uuid()).max(50),
});

/**
 * Fetch a set of movies by id, preserving the input order.
 */
export const getMoviesByIdsFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => getMoviesByIdsInput.parse(input))
  .handler(async ({ data }): Promise<Movie[]> => {
    console.log(`[movies] getMoviesByIdsFn called with ${data.ids.length} ids`);
    if (data.ids.length === 0) return [];

    const { data: rows, error } = await supabaseAdmin
      .from("movies")
      .select(MOVIE_COLUMNS)
      .in("id", data.ids);

    if (error) {
      console.error("[movies] getMoviesByIdsFn error:", error);
      throw new Error(error.message);
    }

    const byId = new Map<string, Movie>();
    for (const row of (rows ?? []) as MovieRow[]) {
      byId.set(row.id, mapRow(row));
    }
    return data.ids
      .map((id) => byId.get(id))
      .filter((m): m is Movie => m !== undefined);
  });

// Server-only TMDb client. Reads process.env at call time inside handlers.
// Uses TMDb v4 Bearer auth (the "API Read Access Token").

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

export type TmdbCategory = "now_showing" | "coming_soon" | "popular";

interface TmdbMovieListItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  release_date: string | null;
  overview: string | null;
  popularity: number | null;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime: number | null;
  release_date: string | null;
  overview: string | null;
  popularity: number | null;
  genres: { id: number; name: string }[];
}

export interface NormalisedMovie {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  backdrop_url: string | null;
  category: TmdbCategory;
  genres: string[];
  duration_minutes: number | null;
  release_date: string | null;
  overview: string | null;
  tmdb_popularity: number | null;
}

function authHeaders(): HeadersInit {
  const token = process.env.TMDB_API_KEY;
  if (!token) throw new Error("TMDB_API_KEY is not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json;charset=utf-8",
  };
}

async function tmdbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${TMDB_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDb ${path} failed: ${res.status} ${res.statusText} ${body}`);
  }
  return res.json() as Promise<T>;
}

function imgUrl(path: string | null, size: "w500" | "w1280"): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

async function fetchList(endpoint: string): Promise<TmdbMovieListItem[]> {
  const data = await tmdbGet<{ results: TmdbMovieListItem[] }>(
    `${endpoint}?language=en-US&page=1`
  );
  return data.results ?? [];
}

async function fetchDetails(id: number): Promise<TmdbMovieDetails> {
  return tmdbGet<TmdbMovieDetails>(`/movie/${id}?language=en-US`);
}

/**
 * Fetch one TMDb category and return normalised rows ready to upsert.
 * Calls /movie/{id} for each item to get runtime + genre names.
 */
export async function fetchCategory(category: TmdbCategory): Promise<NormalisedMovie[]> {
  const endpoint =
    category === "now_showing"
      ? "/movie/now_playing"
      : category === "coming_soon"
        ? "/movie/upcoming"
        : "/movie/popular";

  console.log(`[tmdb] fetching ${endpoint}`);
  const list = await fetchList(endpoint);
  console.log(`[tmdb] ${endpoint} returned ${list.length} items`);

  // Hydrate details in parallel (small N, page 1 only).
  const detailed = await Promise.all(
    list.map(async (m) => {
      try {
        const d = await fetchDetails(m.id);
        return { list: m, details: d };
      } catch (e) {
        console.warn(`[tmdb] details failed for ${m.id}:`, e);
        return { list: m, details: null };
      }
    })
  );

  return detailed.map(({ list: m, details: d }) => ({
    tmdb_id: m.id,
    title: d?.title ?? m.title,
    poster_url: imgUrl(d?.poster_path ?? m.poster_path, "w500"),
    backdrop_url: imgUrl(d?.backdrop_path ?? m.backdrop_path, "w1280"),
    category,
    genres: d?.genres?.map((g) => g.name) ?? [],
    duration_minutes: d?.runtime ?? null,
    release_date: (d?.release_date ?? m.release_date) || null,
    overview: d?.overview ?? m.overview ?? null,
    tmdb_popularity: d?.popularity ?? m.popularity ?? null,
  }));
}

import moviesData from "@/data/mockMovies.json";
import cinemasData from "@/data/mockCinemas.json";

export type MovieCategory = "now_showing" | "coming_soon" | "popular";

export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  category: MovieCategory;
  genres: string[];
  durationMinutes: number;
}

export interface Cinema {
  id: string;
  name: string;
  photoUrl: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  basePrice: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CinemaWithDetails extends Cinema {
  price: number;
  distanceKm: number;
}

export interface CinemaGroup {
  movieId: string;
  cinemas: CinemaWithDetails[];
  isFallback: boolean;
}

/**
 * Kuala Lumpur city center — used as default location when geolocation is
 * unavailable or denied by the user.
 */
export const DEFAULT_LOCATION: Coordinates = {
  latitude: 3.139,
  longitude: 101.6869,
};

const ALL_MOVIES: Movie[] = moviesData as Movie[];
const ALL_CINEMAS: Cinema[] = cinemasData as Cinema[];

/**
 * Deterministic pseudo-random price modifier per (cinema, movie) pair.
 * Same inputs always produce the same output so the UI is stable across
 * navigations. Returns a value in [-3, +5] ringgit.
 */
function priceModifier(cinemaId: string, movieId: string): number {
  let hash = 0;
  const combined = `${cinemaId}::${movieId}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 9) - 3;
}

/**
 * Deterministic boolean indicating whether a cinema screens a given movie.
 * ~75% chance per pair, stable across calls.
 */
function screensMovie(cinemaId: string, movieId: string): boolean {
  let hash = 5381;
  const combined = `${cinemaId}|${movieId}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }
  return Math.abs(hash) % 100 < 75;
}

/**
 * Haversine great-circle distance between two coordinates, in kilometres.
 */
export function calculateDistanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export interface GetMoviesOptions {
  search?: string;
  category?: MovieCategory;
}

export function getAllMovies(): Movie[] {
  return ALL_MOVIES;
}

export function getMovies(options: GetMoviesOptions = {}): Movie[] {
  const { search, category } = options;
  let result = ALL_MOVIES;
  if (category) result = result.filter((m) => m.category === category);
  if (search && search.trim().length > 0) {
    const needle = search.trim().toLowerCase();
    result = result.filter((m) => m.title.toLowerCase().includes(needle));
  }
  return result;
}

export function getMoviesByCategory(): Record<MovieCategory, Movie[]> {
  return {
    now_showing: ALL_MOVIES.filter((m) => m.category === "now_showing"),
    coming_soon: ALL_MOVIES.filter((m) => m.category === "coming_soon"),
    popular: ALL_MOVIES.filter((m) => m.category === "popular"),
  };
}

export function getMovieById(id: string): Movie | undefined {
  return ALL_MOVIES.find((m) => m.id === id);
}

export function getMoviesByIds(ids: string[]): Movie[] {
  return ids
    .map((id) => ALL_MOVIES.find((m) => m.id === id))
    .filter((m): m is Movie => m !== undefined);
}

function cinemaForMovie(cinema: Cinema, movieId: string, userLoc: Coordinates): CinemaWithDetails {
  return {
    ...cinema,
    price: Math.max(8, cinema.basePrice + priceModifier(cinema.id, movieId)),
    distanceKm: calculateDistanceKm(userLoc, {
      latitude: cinema.latitude,
      longitude: cinema.longitude,
    }),
  };
}

function sortCinemas(list: CinemaWithDetails[]): CinemaWithDetails[] {
  return [...list].sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    return a.price - b.price;
  });
}

/**
 * For each movie, return cinemas that screen it sorted by distance then price.
 * Falls back to nearest popular cinemas (sorted by distance only) if no cinema
 * screens the movie.
 */
export function getCinemasForMovies(
  movieIds: string[],
  userLoc: Coordinates,
): CinemaGroup[] {
  return movieIds.map((movieId) => {
    const screening = ALL_CINEMAS.filter((c) => screensMovie(c.id, movieId)).map((c) =>
      cinemaForMovie(c, movieId, userLoc),
    );

    if (screening.length > 0) {
      return {
        movieId,
        cinemas: sortCinemas(screening).slice(0, 12),
        isFallback: false,
      };
    }

    const fallback = ALL_CINEMAS.map((c) => cinemaForMovie(c, movieId, userLoc));
    return {
      movieId,
      cinemas: sortCinemas(fallback).slice(0, 6),
      isFallback: true,
    };
  });
}

export function estimateDriveMinutes(distanceKm: number): number {
  // Assume ~30 km/h average urban speed in KL traffic.
  return Math.max(2, Math.round((distanceKm / 30) * 60));
}

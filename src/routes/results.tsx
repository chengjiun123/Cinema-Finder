import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ResultsHeader } from "@/components/results/results-header";
import { MovieTabBar } from "@/components/results/movie-tab-bar";
import { CinemaCard } from "@/components/results/cinema-card";
import { CinemaCardSkeletonList } from "@/components/results/cinema-card-skeleton";
import { useUserLocation } from "@/hooks/use-user-location";
import {
  getCinemasForMovies,
  getMoviesByIds,
  type CinemaGroup,
} from "@/lib/cinema-data";

const resultsSearchSchema = z.object({
  movies: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/results")({
  validateSearch: zodValidator(resultsSearchSchema),
  head: () => ({
    meta: [
      { title: "Cinema Finder — Your cinema results" },
      {
        name: "description",
        content:
          "Cinemas screening your selected movies, sorted by distance and price.",
      },
    ],
  }),
  component: ResultsPage,
});

function parseMovieIds(raw: string): string[] {
  if (!raw) return [];
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

function ResultsPage() {
  const search = Route.useSearch();
  const movieIds = useMemo(() => parseMovieIds(search.movies), [search.movies]);
  const movies = useMemo(() => getMoviesByIds(movieIds), [movieIds]);

  const { location, status, isFallback, request } = useUserLocation(true);

  const [activeMovieId, setActiveMovieId] = useState<string>(movieIds[0] ?? "");
  useEffect(() => {
    if (movieIds.length > 0 && !movieIds.includes(activeMovieId)) {
      setActiveMovieId(movieIds[0]);
    }
  }, [movieIds, activeMovieId]);

  // Brief skeleton flash while we wait for the first location resolution.
  const isResolving = status === "requesting" || status === "idle";

  const groups: CinemaGroup[] = useMemo(
    () => (isResolving ? [] : getCinemasForMovies(movieIds, location)),
    [movieIds, location, isResolving],
  );

  const activeGroup = groups.find((g) => g.movieId === activeMovieId);
  const activeMovie = movies.find((m) => m.id === activeMovieId);

  if (movieIds.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div className="app-frame pb-16">
      <ResultsHeader
        backSearch={{ movies: search.movies }}
        locationStatus={status}
        isFallback={isFallback}
        onRetryLocation={request}
      />

      <div className="px-5 pt-4">
        <MovieTabBar
          movies={movies}
          activeMovieId={activeMovieId}
          onSelect={setActiveMovieId}
        />

        {activeMovie && (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
              <img
                src={activeMovie.posterUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Showing cinemas for
              </p>
              <p className="text-display truncate text-sm font-semibold">
                {activeMovie.title}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5">
          {isResolving ? (
            <CinemaCardSkeletonList count={5} />
          ) : activeGroup ? (
            <CinemaList group={activeGroup} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CinemaList({ group }: { group: CinemaGroup }) {
  if (group.cinemas.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-elevated px-4 py-6 text-center text-sm text-muted-foreground">
        No cinemas found nearby. Try widening your search.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {group.isFallback && (
        <div
          role="status"
          className="rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-xs text-foreground/90"
        >
          No cinema currently screens this movie. Here are the nearest popular cinemas.
        </div>
      )}
      {group.cinemas.map((cinema, idx) => (
        <CinemaCard key={cinema.id} cinema={cinema} rank={idx + 1} />
      ))}
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="app-frame flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="text-display text-lg font-semibold">No movies selected</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick at least one movie to see cinemas near you.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-fab transition hover:opacity-90"
      >
        Browse movies
      </Link>
    </div>
  );
}

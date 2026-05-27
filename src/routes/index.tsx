import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { AppHeader } from "@/components/landing/app-header";
import { FindCinemasFab } from "@/components/landing/find-cinemas-fab";
import { MovieRow } from "@/components/landing/movie-row";
import { SearchBar } from "@/components/landing/search-bar";
import { getMovies, getMoviesByCategory } from "@/lib/cinema-data";

const INDEX_DEFAULTS = { movies: "", q: "" } as const;

const indexSearchSchema = z.object({
  movies: fallback(z.string(), INDEX_DEFAULTS.movies).default(INDEX_DEFAULTS.movies),
  q: fallback(z.string(), INDEX_DEFAULTS.q).default(INDEX_DEFAULTS.q),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(indexSearchSchema),
  search: {
    middlewares: [stripSearchParams(INDEX_DEFAULTS)],
  },
  head: () => ({
    meta: [
      { title: "Cinema Finder — Pick your movies" },
      {
        name: "description",
        content:
          "Browse Now Showing, Coming Soon and Popular movies. Multi-select to compare cinemas near you by distance and price.",
      },
      { property: "og:title", content: "Cinema Finder — Pick your movies" },
      {
        property: "og:description",
        content:
          "Skip the multi-tab cinema hunt. Pick your movies and we'll show you the closest, cheapest option.",
      },
    ],
  }),
  component: LandingPage,
});

function parseMovieIds(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function serializeMovieIds(ids: string[]): string {
  return ids.join(",");
}

function LandingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const selectedIds = useMemo(() => new Set(parseMovieIds(search.movies)), [search.movies]);
  const query = search.q;

  const categories = useMemo(() => getMoviesByCategory(), []);
  const searchResults = useMemo(
    () => (query.trim() ? getMovies({ search: query }) : null),
    [query],
  );

  type IndexSearch = z.infer<typeof indexSearchSchema>;

  const setSelection = (next: Set<string>) => {
    navigate({
      search: (prev: IndexSearch) => ({ ...prev, movies: serializeMovieIds([...next]) }),
      replace: true,
    });
  };

  const handleToggle = (movieId: string) => {
    const next = new Set(selectedIds);
    if (next.has(movieId)) next.delete(movieId);
    else next.add(movieId);
    setSelection(next);
  };

  const handleSearchChange = (q: string) => {
    navigate({ search: (prev: IndexSearch) => ({ ...prev, q }), replace: true });
  };

  const handleFindCinemas = () => {
    if (selectedIds.size === 0) return;
    navigate({
      to: "/results",
      search: { movies: serializeMovieIds([...selectedIds]) },
    });
  };

  const isSearching = searchResults !== null;
  const hasNoSearchMatches = isSearching && searchResults!.length === 0;

  return (
    <main className="app-frame pb-32" aria-label="Browse movies">
      <AppHeader />
      <div className="px-5">
        <SearchBar value={query} onChange={handleSearchChange} />
      </div>

      <p className="sr-only" aria-live="polite">
        {selectedIds.size === 0
          ? "No movies selected"
          : `${selectedIds.size} ${selectedIds.size === 1 ? "movie" : "movies"} selected`}
      </p>

      {isSearching ? (
        hasNoSearchMatches ? (
          <EmptySearchState
            onShowPopular={() => {
              handleSearchChange("");
              toast.info("Showing popular movies instead");
            }}
          />
        ) : (
          <MovieRow
            title={`Results for "${query}"`}
            movies={searchResults!}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
        )
      ) : (
        <>
          <MovieRow
            title="Now Showing"
            movies={categories.now_showing}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
          <MovieRow
            title="Popular This Week"
            movies={categories.popular}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
          <MovieRow
            title="Coming Soon"
            movies={categories.coming_soon}
            selectedIds={selectedIds}
            onToggle={handleToggle}
          />
        </>
      )}

      <div className="px-5">
        <FindCinemasFab count={selectedIds.size} onClick={handleFindCinemas} />
      </div>
    </main>
  );
}

function EmptySearchState({ onShowPopular }: { onShowPopular: () => void }) {
  return (
    <div className="mt-10 px-5 text-center">
      <p className="text-display text-lg font-semibold">No matches</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Try another title — or browse what's hot right now.
      </p>
      <button
        type="button"
        onClick={onShowPopular}
        className="mt-5 inline-flex h-10 items-center rounded-full bg-surface-elevated px-5 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        Show popular movies
      </button>
    </div>
  );
}

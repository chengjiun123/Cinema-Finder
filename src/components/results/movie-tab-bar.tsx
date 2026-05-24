import type { Movie } from "@/lib/cinema-data";

interface MovieTabBarProps {
  movies: Movie[];
  activeMovieId: string;
  onSelect: (movieId: string) => void;
}

export function MovieTabBar({ movies, activeMovieId, onSelect }: MovieTabBarProps) {
  if (movies.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Selected movies"
      className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
    >
      {movies.map((movie) => {
        const isActive = movie.id === activeMovieId;
        return (
          <button
            key={movie.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelect(movie.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isActive
                ? "bg-primary text-primary-foreground shadow-fab"
                : "bg-surface-elevated text-foreground/80 hover:text-foreground"
            }`}
          >
            {movie.title}
          </button>
        );
      })}
    </div>
  );
}

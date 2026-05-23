import type { Movie } from "@/lib/cinema-data";
import { MoviePosterCard } from "./movie-poster-card";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  selectedIds: Set<string>;
  onToggle: (movieId: string) => void;
}

export function MovieRow({ title, movies, selectedIds, onToggle }: MovieRowProps) {
  if (movies.length === 0) return null;
  return (
    <section aria-labelledby={`row-${title}`} className="mt-6">
      <h2
        id={`row-${title}`}
        className="text-display px-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {title}
      </h2>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto scroll-smooth px-5 pb-2">
        {movies.map((movie) => (
          <MoviePosterCard
            key={movie.id}
            movie={movie}
            isSelected={selectedIds.has(movie.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

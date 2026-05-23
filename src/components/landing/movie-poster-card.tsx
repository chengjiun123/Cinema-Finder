import { Check } from "lucide-react";
import { useState } from "react";
import type { Movie } from "@/lib/cinema-data";

interface MoviePosterCardProps {
  movie: Movie;
  isSelected: boolean;
  onToggle: (movieId: string) => void;
}

export function MoviePosterCard({ movie, isSelected, onToggle }: MoviePosterCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onToggle(movie.id)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Deselect" : "Select"} ${movie.title}`}
      className="group relative w-32 shrink-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-card">
        {!imageFailed ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className={`h-full w-full object-cover transition duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } ${isSelected ? "scale-[1.02]" : "group-active:scale-95"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-elevated p-3 text-center text-xs text-muted-foreground">
            {movie.title}
          </div>
        )}

        {/* Selection overlay */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-xl transition ${
            isSelected
              ? "ring-2 ring-primary bg-primary/10"
              : "ring-1 ring-inset ring-border/40 group-hover:ring-border"
          }`}
        />

        {isSelected && (
          <div className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-fab animate-in zoom-in-50 duration-200">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground/90">{movie.title}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {movie.genres[0]}
      </p>
    </button>
  );
}

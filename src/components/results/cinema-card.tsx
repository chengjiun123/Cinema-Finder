import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, Clock, ImageOff } from "lucide-react";
import { estimateDriveMinutes, type CinemaWithDetails } from "@/lib/cinema-data";
import { cn } from "@/lib/utils";

interface CinemaCardProps {
  cinema: CinemaWithDetails;
  rank: number;
  isExpanded?: boolean;
  onToggle?: (id: string) => void;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function formatPrice(rm: number): string {
  return `RM ${rm.toFixed(0)}`;
}

export function CinemaCard({ cinema, rank, isExpanded = false, onToggle }: CinemaCardProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (isExpanded && articleRef.current) {
      const id = window.setTimeout(() => {
        articleRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 260);
      return () => window.clearTimeout(id);
    }
  }, [isExpanded]);

  const driveMins = estimateDriveMinutes(cinema.distanceKm);
  const label = `${cinema.name} — ${formatDistance(cinema.distanceKm)} away, ${formatPrice(cinema.price)}`;

  return (
    <article
      ref={articleRef}
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-2xl bg-surface shadow-card transition-all duration-200",
        isExpanded && "ring-1 ring-primary/40",
      )}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`cinema-${cinema.id}-details`}
        onClick={() => onToggle?.(cinema.id)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition active:scale-[0.99]"
      >
        <div
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-elevated text-xs font-semibold text-muted-foreground"
        >
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-display truncate text-sm font-semibold leading-tight">
            {cinema.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatDistance(cinema.distanceKm)} away</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-display text-base font-bold tabular-nums text-primary">
            {formatPrice(cinema.price)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">per ticket</p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <div
        id={`cinema-${cinema.id}-details`}
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 px-3.5 pb-4 pt-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-elevated">
              {!imgFailed ? (
                <img
                  src={cinema.photoUrl}
                  alt={`${cinema.name} interior`}
                  loading="lazy"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgFailed(true)}
                  className={cn(
                    "h-full w-full object-cover transition-opacity duration-500",
                    imgLoaded ? "opacity-100" : "opacity-0",
                  )}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-6 w-6" aria-hidden="true" />
                </div>
              )}
              {!imgLoaded && !imgFailed && (
                <div className="absolute inset-0 animate-pulse bg-surface-elevated" />
              )}
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{cinema.address}</span>
            </p>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>~{driveMins} min drive</span>
            </p>

            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {cinema.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

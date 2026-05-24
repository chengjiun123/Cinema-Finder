import { MapPin } from "lucide-react";
import type { CinemaWithDetails } from "@/lib/cinema-data";

interface CinemaCardProps {
  cinema: CinemaWithDetails;
  rank: number;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function formatPrice(rm: number): string {
  return `RM ${rm.toFixed(0)}`;
}

export function CinemaCard({ cinema, rank }: CinemaCardProps) {
  return (
    <article
      aria-label={`${cinema.name} — ${formatDistance(cinema.distanceKm)} away, ${formatPrice(cinema.price)}`}
      className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 shadow-card transition active:scale-[0.99]"
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
    </article>
  );
}

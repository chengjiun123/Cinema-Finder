import { ArrowLeft, MapPin, MapPinOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { LocationStatus } from "@/hooks/use-user-location";

interface ResultsHeaderProps {
  backSearch: { movies: string };
  locationStatus: LocationStatus;
  isFallback: boolean;
  onRetryLocation: () => void;
}

export function ResultsHeader({
  backSearch,
  locationStatus,
  isFallback,
  onRetryLocation,
}: ResultsHeaderProps) {
  return (
    <header className="sticky top-0 z-30 -mx-0 border-b border-border/60 bg-background/85 px-5 pb-3 pt-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          search={backSearch}
          aria-label="Back to movie selection"
          className="grid h-10 w-10 place-items-center rounded-full bg-surface-elevated text-foreground outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-display truncate text-lg font-semibold leading-tight">
            Your cinemas
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Sorted by distance, then price
          </p>
        </div>
      </div>

      {isFallback && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2.5 rounded-xl bg-surface-elevated px-3 py-2.5 text-xs"
        >
          {locationStatus === "unsupported" ? (
            <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          )}
          <div className="flex-1 leading-relaxed text-muted-foreground">
            <span className="text-foreground/90">
              {locationStatus === "denied"
                ? "Location access denied."
                : locationStatus === "unsupported"
                  ? "Location not supported."
                  : "Using Kuala Lumpur city center."}
            </span>{" "}
            Distances are estimated.
          </div>
          {locationStatus !== "unsupported" && (
            <button
              type="button"
              onClick={onRetryLocation}
              className="shrink-0 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Use my location
            </button>
          )}
        </div>
      )}
    </header>
  );
}

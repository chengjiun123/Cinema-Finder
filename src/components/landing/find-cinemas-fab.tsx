import { ArrowRight } from "lucide-react";

interface FindCinemasFabProps {
  count: number;
  onClick: () => void;
}

export function FindCinemasFab({ count, onClick }: FindCinemasFabProps) {
  if (count === 0) return null;
  const label = count > 8 ? "8+" : String(count);

  return (
    <div className="pointer-events-none sticky bottom-0 z-30 -mx-5 px-5 pb-5 pt-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/85 to-transparent" />
      <button
        type="button"
        onClick={onClick}
        aria-label={`Find cinemas for ${count} selected ${count === 1 ? "movie" : "movies"}`}
        className="pointer-events-auto relative flex h-14 w-full items-center justify-between rounded-full bg-primary px-5 text-primary-foreground shadow-fab transition-transform duration-300 hover:scale-[1.01] active:scale-[0.98] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/15 text-sm font-bold">
            {label}
          </span>
          <span className="text-display text-base font-semibold">Find cinemas</span>
        </span>
        <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}

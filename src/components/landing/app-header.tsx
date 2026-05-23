import { Film } from "lucide-react";

export function AppHeader() {
  return (
    <header className="px-5 pt-7 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow">
          <Film className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <span className="text-display text-lg font-semibold tracking-tight">
          CinemaFinder
        </span>
      </div>
      <h1 className="text-display mt-5 text-3xl font-semibold leading-tight tracking-tight">
        Find the best cinema
        <br />
        <span className="text-primary">for tonight.</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick your movies — we'll sort cinemas by distance and price.
      </p>
    </header>
  );
}

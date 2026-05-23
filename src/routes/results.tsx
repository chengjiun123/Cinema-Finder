import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

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
        content: "Cinemas screening your selected movies, sorted by distance and price.",
      },
    ],
  }),
  component: ResultsPlaceholder,
});

function ResultsPlaceholder() {
  return (
    <div className="app-frame flex min-h-screen items-center justify-center px-5">
      <div className="text-center">
        <p className="text-display text-lg font-semibold">Results page — coming in Module 2</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your selected movies are preserved. Use the back button to return.
        </p>
      </div>
    </div>
  );
}

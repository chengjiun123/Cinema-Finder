import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { syncTmdbMovies, type SyncResult } from "@/lib/tmdb-sync.functions";

export const Route = createFileRoute("/sync")({
  component: SyncPage,
  head: () => ({
    meta: [{ title: "TMDb Sync (admin)" }],
  }),
});

function SyncPage() {
  const sync = useServerFn(syncTmdbMovies);
  const mutation = useMutation<SyncResult>({
    mutationFn: () => sync(),
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">TMDb Sync</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fetches Now Playing, Upcoming, and Popular from TMDb and upserts them into
        the <code>movies</code> table. Temporary page for Module 2 testing.
      </p>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {mutation.isPending ? "Syncing…" : "Run sync"}
      </button>

      {mutation.isError && (
        <p className="mt-4 text-sm text-destructive">
          Error: {(mutation.error as Error).message}
        </p>
      )}

      {mutation.data && (
        <pre className="mt-6 rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(mutation.data, null, 2)}
        </pre>
      )}
    </main>
  );
}

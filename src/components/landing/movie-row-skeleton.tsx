interface MovieRowSkeletonProps {
  cards?: number;
}

export function MovieRowSkeleton({ cards = 5 }: MovieRowSkeletonProps) {
  return (
    <section className="mt-6">
      <div className="mx-5 h-3.5 w-32 animate-pulse rounded bg-muted" />
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="w-32 shrink-0">
            <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-1.5 h-2 w-12 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>
    </section>
  );
}

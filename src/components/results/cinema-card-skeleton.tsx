import { Skeleton } from "@/components/ui/skeleton";

export function CinemaCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 shadow-card">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <div className="space-y-1.5 text-right">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="ml-auto h-2 w-10" />
      </div>
    </div>
  );
}

export function CinemaCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <CinemaCardSkeleton key={i} />
      ))}
    </div>
  );
}

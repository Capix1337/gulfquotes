import { Shell } from "@/components/shells/shell";
import { Skeleton } from "@/components/ui/skeleton";

export function TagsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton quotes grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>

      {/* Skeleton pagination */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function TagLoading() {
  return (
    <Shell>
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Skeleton tag header */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mt-3" />
        </div>

        {/* Skeleton sort controls */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Quotes list skeleton */}
        <TagsLoadingSkeleton />
      </div>
    </Shell>
  );
}
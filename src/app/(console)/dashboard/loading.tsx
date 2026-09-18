import { Skeleton } from "@/components/ui/skeleton";

const CARD_KEYS = ["a", "b", "c", "d"] as const;

/** Suspense skeleton for the Response dashboard, mirroring its layout. */
export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARD_KEYS.map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>

      <Skeleton className="mt-8 h-80 rounded-xl" />
    </div>
  );
}

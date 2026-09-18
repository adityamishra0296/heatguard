import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_KEYS = ["a", "b", "c", "d", "e", "f", "g"] as const;
const ROW_KEYS = ["a", "b", "c", "d", "e"] as const;

/** Suspense fallback for the region detail 7-day forecast. */
export function ForecastSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-5 w-32" />
      <div className="mt-3 flex gap-2 overflow-hidden">
        {DAY_KEYS.map((key) => (
          <Skeleton key={key} className="h-32 w-28 shrink-0 rounded-lg" />
        ))}
      </div>
    </Card>
  );
}

/** Suspense fallback for the Overview predicted-risk widget. */
export function PredictedRiskSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-5 w-48" />
      <div className="mt-3 flex flex-col gap-2">
        {ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-6 w-full" />
        ))}
      </div>
    </Card>
  );
}

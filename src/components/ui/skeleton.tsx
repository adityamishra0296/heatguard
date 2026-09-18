import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * LoadingSkeleton primitive — a pulsing placeholder block. Compose several to
 * mirror the shape of the content being loaded (see the route `loading.tsx`).
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

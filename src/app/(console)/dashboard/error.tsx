"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Error boundary for the Response dashboard with a retry action. */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-5 py-20 text-center">
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        We couldn’t load the monitoring dashboard. This may be a temporary
        issue.
      </p>
      <Button onClick={() => reset()} className="mt-4">
        <RotateCw className="size-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}

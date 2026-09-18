"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Error boundary for the region detail page with retry and a safe way back. */
export default function RegionDetailError({
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
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-5 py-20 text-center">
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">Couldn’t load this region</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Something went wrong while loading the region detail. This may be a
        temporary issue.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => reset()}>
          <RotateCw className="size-4" aria-hidden />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to monitoring</Link>
        </Button>
      </div>
    </div>
  );
}

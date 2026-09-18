import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Rendered when getRegionDetail() calls notFound() for an unknown region id. */
export default function RegionNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-5 py-20 text-center">
      <MapPin className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">Region not found</h1>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        We couldn’t find a region with that id. It may have been removed or the
        link may be incorrect.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard">Back to monitoring</Link>
      </Button>
    </div>
  );
}

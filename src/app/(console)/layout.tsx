import type { ReactNode } from "react";

import { AppShell } from "@/features/console/app-shell";
import { getLatestReadingTimestamp, getRegionsList } from "@/server/regions";

// The shell shows a live "last updated" time and region list, so render per
// request rather than caching at build time.
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [regions, lastUpdated] = await Promise.all([
    getRegionsList(),
    getLatestReadingTimestamp(),
  ]);

  return (
    <AppShell regions={regions} lastUpdated={lastUpdated}>
      {children}
    </AppShell>
  );
}

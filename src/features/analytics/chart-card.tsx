import type { ReactNode } from "react";

import { DataEmptyState } from "@/components/data-empty-state";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Frame for an analytics chart: a `<figure>` whose `<figcaption>` (title +
 * description) gives the chart an accessible name/description, with a built-in
 * empty state.
 */
export function ChartCard({
  title,
  description,
  isEmpty = false,
  emptyMessage,
  className,
  children,
}: {
  title: string;
  description?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <figure className="m-0">
        <figcaption className="mb-3">
          <h2 className="font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </figcaption>
        {isEmpty ? (
          <DataEmptyState
            className="py-10"
            title="No data"
            description={
              emptyMessage ?? "No data for the selected region and range."
            }
          />
        ) : (
          children
        )}
      </figure>
    </Card>
  );
}

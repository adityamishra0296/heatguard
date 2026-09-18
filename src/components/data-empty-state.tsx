import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A neutral placeholder shown when a data set is empty. */
export function DataEmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 text-muted-foreground" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="text-base font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

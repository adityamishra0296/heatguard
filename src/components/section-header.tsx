import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A titled section header with an optional description and right-aligned actions. */
export function SectionHeader({
  title,
  description,
  actions,
  as: Heading = "h2",
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const headingClass =
    Heading === "h1"
      ? "text-2xl font-bold tracking-tight sm:text-3xl"
      : "text-lg font-semibold";

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className={headingClass}>{title}</Heading>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

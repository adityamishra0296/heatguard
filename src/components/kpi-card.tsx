import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTone = "neutral" | "warning" | "danger";

/** Icon accent colour per tone, drawn from the heat scale. */
const TONE_ICON: Record<KpiTone, string> = {
  neutral: "text-muted-foreground",
  warning: "text-heat-orange",
  danger: "text-heat-red",
};

/** A single key-performance-indicator card: label, big value, and a sublabel. */
export function KPICard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon ? (
          <Icon
            className={cn("size-4 shrink-0", TONE_ICON[tone])}
            aria-hidden
          />
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      {sublabel ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {sublabel}
        </p>
      ) : null}
    </Card>
  );
}

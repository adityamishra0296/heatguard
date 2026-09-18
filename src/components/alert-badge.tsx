import type { HeatAlertLevel } from "@/lib/enums";
import { cn } from "@/lib/utils";

/**
 * Colour-coded heat-alert badge built on the theme heat scale.
 *
 * Identity is carried by a coloured dot, a tinted background, and a coloured
 * border, while the text label stays in foreground ink — so it is never
 * colour-alone (readable for colour-blind users and forced-colours mode) and
 * the label always meets contrast requirements.
 */
const LEVEL_STYLES: Record<
  HeatAlertLevel,
  { label: string; badge: string; dot: string }
> = {
  NORMAL: {
    label: "Normal",
    badge: "border-heat-normal/30 bg-heat-normal/12",
    dot: "bg-heat-normal",
  },
  YELLOW: {
    label: "Yellow",
    badge: "border-heat-yellow/40 bg-heat-yellow/15",
    dot: "bg-heat-yellow",
  },
  ORANGE: {
    label: "Orange",
    badge: "border-heat-orange/40 bg-heat-orange/15",
    dot: "bg-heat-orange",
  },
  RED: {
    label: "Red",
    badge: "border-heat-red/40 bg-heat-red/15",
    dot: "bg-heat-red",
  },
};

export function AlertBadge({
  level,
  className,
}: {
  level: HeatAlertLevel;
  className?: string;
}) {
  const style = LEVEL_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}

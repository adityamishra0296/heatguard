import type { HeatAlertLevel } from "@/lib/enums";
import { ALERT_LEVEL_THRESHOLDS_C } from "@/lib/heat/alert-level";
import { Card } from "@/components/ui/card";

const { YELLOW, ORANGE, RED } = ALERT_LEVEL_THRESHOLDS_C;

const ITEMS: Array<{
  level: HeatAlertLevel;
  label: string;
  range: string;
  dot: string;
}> = [
  {
    level: "NORMAL",
    label: "Normal",
    range: `< ${YELLOW}°C`,
    dot: "bg-heat-normal",
  },
  {
    level: "YELLOW",
    label: "Yellow",
    range: `${YELLOW}–${ORANGE}°C`,
    dot: "bg-heat-yellow",
  },
  {
    level: "ORANGE",
    label: "Orange",
    range: `${ORANGE}–${RED}°C`,
    dot: "bg-heat-orange",
  },
  { level: "RED", label: "Red", range: `≥ ${RED}°C`, dot: "bg-heat-red" },
];

/** Inline legend of the heat-index thresholds used by classifyAlertLevel(). */
export function ThresholdLegend() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Alert thresholds</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Heat-index bands from{" "}
        <code className="text-[11px]">classifyAlertLevel()</code>.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {ITEMS.map((item) => (
          <li key={item.level} className="flex items-center gap-2 text-sm">
            <span
              className={`size-3 shrink-0 rounded-full ${item.dot}`}
              aria-hidden
            />
            <span className="font-medium">{item.label}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {item.range}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

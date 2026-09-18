"use client";

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

/**
 * Themed tooltip content for Recharts, styled with popover tokens so it works
 * in light and dark mode. Passed via `<Tooltip content={<ChartTooltip … />} />`;
 * Recharts injects `active`, `payload`, and `label`.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = "",
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  unit?: string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const heading =
    label === undefined
      ? null
      : labelFormatter
        ? labelFormatter(String(label))
        : String(label);

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {heading ? <p className="mb-1 font-medium">{heading}</p> : null}
      <ul className="flex flex-col gap-0.5">
        {payload.map((entry, index) => (
          <li
            key={`${entry.name}-${index}`}
            className="flex items-center gap-2"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {entry.value}
              {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

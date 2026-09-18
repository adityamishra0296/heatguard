import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StatusCodeResult } from "@/lib/heat/status-code";

const SEVERITY_TEXT = [
  "text-muted-foreground",
  "text-heat-yellow",
  "text-heat-orange",
  "text-heat-red",
];

const SEVERITY_BG = [
  "bg-muted/40",
  "bg-heat-yellow/12",
  "bg-heat-orange/12",
  "bg-heat-red/12",
];

const EXAMPLES: Array<{ code: string; meaning: string }> = [
  { code: "0000", meaning: "All systems normal." },
  {
    code: "2000",
    meaning: "Heat warning (a region at Orange); everything else normal.",
  },
  { code: "3000", meaning: "Heat critical (a region at Red)." },
  {
    code: "3130",
    meaning: "Heat critical, one stale feed, high vulnerability under alert.",
  },
  {
    code: "3033",
    meaning: "Heat critical, high vulnerability, and lagging recovery.",
  },
];

/** Documented 4-digit system health code with a per-digit breakdown. */
export function StatusCodePanel({
  statusCode,
}: {
  statusCode: StatusCodeResult;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">System status code</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Four digits; each is a 0–3 severity (0 = normal) for one condition.
          </p>
        </div>
        <div className="text-right">
          <div
            className="font-mono text-4xl font-bold tracking-[0.2em] tabular-nums"
            aria-label={`Status code ${statusCode.code.split("").join(" ")}, overall ${statusCode.overall}`}
          >
            {statusCode.digits.map((digit) => (
              <span key={digit.key} className={SEVERITY_TEXT[digit.value]}>
                {digit.value}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Overall: {statusCode.overall}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {statusCode.digits.map((digit, index) => (
          <li
            key={digit.key}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-3",
              SEVERITY_BG[digit.value],
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md bg-background font-mono text-lg font-bold",
                SEVERITY_TEXT[digit.value],
              )}
            >
              {digit.value}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {index + 1}. {digit.label}{" "}
                {/* De-emphasised via dark ink at reduced opacity (not
                    muted-foreground) so it stays legible on the colour tints. */}
                <span className="text-xs font-normal text-foreground/80">
                  · {digit.state}
                </span>
              </p>
              <p className="text-xs text-foreground/80">{digit.meaning}</p>
              <p className="mt-0.5 text-xs">{digit.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <p className="text-xs font-semibold text-muted-foreground">
          Worked examples
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {EXAMPLES.map((example) => (
            <li
              key={example.code}
              className="flex items-baseline gap-2 text-xs"
            >
              <span className="font-mono font-semibold tabular-nums">
                {example.code}
              </span>
              <span className="text-muted-foreground">{example.meaning}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

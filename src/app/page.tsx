import Link from "next/link";
import { ArrowRight, ShieldAlert, ThermometerSun } from "lucide-react";

import { Button } from "@/components/ui/button";

/** IMD-style heat-wave alert levels, shown on the landing page as a brand cue. */
const ALERT_LEVELS = [
  { label: "Normal", swatch: "bg-emerald-500" },
  { label: "Yellow", swatch: "bg-yellow-400" },
  { label: "Orange", swatch: "bg-orange-500" },
  { label: "Red", swatch: "bg-red-600" },
] as const;

const FOCUS_STATES =
  "Telangana · Andhra Pradesh · Odisha · Rajasthan · Maharashtra · Delhi";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
      {/* Subtle heat-gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(249, 115, 22, 0.12), transparent 70%)",
        }}
      />

      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <ShieldAlert className="size-3.5 text-orange-500" aria-hidden />
          Heat Wave Disaster Management &amp; Early Warning
        </span>

        <div className="mt-6 flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            aria-hidden
          >
            <ThermometerSun className="size-6" />
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            HeatGuard
          </h1>
        </div>

        <p className="mt-5 text-balance text-lg text-muted-foreground sm:text-xl">
          Monitor heat-wave risk, issue early warnings, protect vulnerable
          populations, and track recovery — across India.
        </p>

        <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard">
              Enter Dashboard
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {/* Alert-level legend */}
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {ALERT_LEVELS.map((level) => (
            <li
              key={level.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span
                className={`size-2.5 rounded-full ${level.swatch}`}
                aria-hidden
              />
              {level.label}
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        <p>Focus states (v1)</p>
        <p className="mt-1 font-medium">{FOCUS_STATES}</p>
      </footer>
    </main>
  );
}

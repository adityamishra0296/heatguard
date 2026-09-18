import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AlertBadge } from "@/components/alert-badge";
import { TrendChart } from "@/components/charts/trend-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForecastSkeleton } from "@/features/forecast/forecast-skeleton";
import { RegionForecastSection } from "@/features/forecast/region-forecast-section";
import { NotFoundError } from "@/lib/api/http";
import { toHeatAlertLevel } from "@/lib/enums";
import { formatDateTimeUTC, formatDateUTC, formatNumber } from "@/lib/format";
import {
  getRegionDetail,
  getRegionIdentity,
  type RegionDetail,
} from "@/server/regions";

// Near-real-time: render on every request so the detail view reflects the
// latest readings rather than a build-time snapshot.
export const dynamic = "force-dynamic";

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Runs before the response is committed, so a missing region yields a real 404
 * status here (rather than a streamed 200) while the page below still shows a
 * loading skeleton for the heavier detail query.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const region = await getRegionIdentity(id);
    return { title: `${region.name}, ${region.state}` };
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export default async function RegionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detail: RegionDetail | null = null;
  try {
    detail = await getRegionDetail(id);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }
  if (!detail) {
    notFound();
  }

  const { region, current, vulnerability, readings, alerts, recovery } = detail;
  const latestRecovery = recovery.at(-1) ?? null;

  const heatIndexValues = readings.map((r) => r.heatIndexC);
  const trendAriaLabel =
    heatIndexValues.length > 0
      ? `Heat index and maximum temperature over the last ${readings.length} daily readings. Heat index ranges from ${round1(Math.min(...heatIndexValues))} to ${round1(Math.max(...heatIndexValues))} °C.`
      : "No readings available.";

  const headerStats = [
    {
      label: "Current heat index",
      value:
        current.latestReading !== null
          ? `${round1(current.latestReading.heatIndexC)}°C`
          : "—",
    },
    {
      label: "Health risk",
      value:
        current.healthRiskScore !== null
          ? `${current.healthRiskScore} / 100`
          : "—",
    },
    {
      label: "Last reading",
      value:
        current.latestReading !== null
          ? formatDateTimeUTC(current.latestReading.timestamp)
          : "—",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/dashboard">
          <ArrowLeft className="size-4" aria-hidden />
          Back to monitoring
        </Link>
      </Button>

      <header className="mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {region.state} · {region.districtType}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {region.name}
            </h1>
          </div>
          <AlertBadge
            level={current.level}
            className="mt-1 px-3 py-1 text-sm"
          />
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {headerStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card px-4 py-3"
            >
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-6 grid gap-4">
        {/* Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Temperature &amp; heat-index trend</CardTitle>
            <CardDescription>
              Last {readings.length} daily readings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {readings.length > 0 ? (
              <TrendChart
                unit="°C"
                ariaLabel={trendAriaLabel}
                series={[
                  {
                    label: "Heat index",
                    color: "var(--color-chart-1)",
                    values: heatIndexValues,
                    primary: true,
                  },
                  {
                    label: "Max temp",
                    color: "var(--color-chart-2)",
                    values: readings.map((r) => r.maxTempC),
                  },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No readings available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI 7-day forecast (degrades gracefully if the service is offline). */}
        <Suspense fallback={<ForecastSkeleton />}>
          <RegionForecastSection regionId={region.id} />
        </Suspense>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Vulnerability */}
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability snapshot</CardTitle>
              <CardDescription>
                Composite heat-vulnerability index
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vulnerability ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tabular-nums">
                      {vulnerability.score}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <div
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, vulnerability.score))}%`,
                      }}
                    />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {[
                      {
                        label: "Elderly (65+)",
                        value: formatNumber(vulnerability.elderlyCount),
                      },
                      {
                        label: "Outdoor workers",
                        value: formatNumber(vulnerability.outdoorWorkersCount),
                      },
                      {
                        label: "Children (under 5)",
                        value: formatNumber(vulnerability.childrenCount),
                      },
                      {
                        label: "Cooling access",
                        value: `${vulnerability.hasCoolingAccessPct}%`,
                      },
                      {
                        label: "Water access",
                        value: `${vulnerability.hasWaterAccessPct}%`,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between gap-2"
                      >
                        <dt className="text-muted-foreground">{item.label}</dt>
                        <dd className="font-medium tabular-nums">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No vulnerability data for this region.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recovery */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery snapshot</CardTitle>
              <CardDescription>
                {latestRecovery
                  ? `Week ending ${formatDateUTC(latestRecovery.date)}`
                  : "Most recent recovery indicators"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestRecovery ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {[
                    {
                      label: "Hospital admissions",
                      value: formatNumber(latestRecovery.hospitalAdmissions),
                    },
                    {
                      label: "Workdays lost",
                      value: formatNumber(latestRecovery.workdaysLost),
                    },
                    {
                      label: "Crop loss",
                      value: `${latestRecovery.cropLossPct}%`,
                    },
                    {
                      label: "Electricity failures",
                      value: formatNumber(latestRecovery.electricityFailures),
                    },
                    {
                      label: "Water scarcity index",
                      value: `${latestRecovery.waterScarcityIndex}`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between gap-2"
                    >
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="font-medium tabular-nums">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recovery indicators recorded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active &amp; recent alerts</CardTitle>
            <CardDescription>
              Most recent early-warning bulletins
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {alerts.slice(0, 6).map((alert) => (
                  <li
                    key={alert.id}
                    className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertBadge level={toHeatAlertLevel(alert.level)} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateUTC(alert.issuedAt)}
                      </span>
                      {alert.active ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No alerts recorded for this region.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

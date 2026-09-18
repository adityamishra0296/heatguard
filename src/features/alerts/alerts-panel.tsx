"use client";

import { useState, useTransition } from "react";
import { Bell, Send, X } from "lucide-react";

import { AlertBadge } from "@/components/alert-badge";
import { DataEmptyState } from "@/components/data-empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  acknowledgeAlert,
  ApiClientError,
  createAlert,
} from "@/lib/api-client";
import { classifyAlertLevel } from "@/lib/heat/alert-level";
import type { AlertWithRegionDTO } from "@/server/alerts";

import { AlertFeedItem } from "./alert-feed-item";

interface RegionOption {
  id: string;
  name: string;
  state: string;
}

interface Toast {
  id: number;
  title: string;
  body: string;
}

/** Owns the alert-feed state; handles simulate (persist + toast) and optimistic
 *  acknowledge with rollback. */
export function AlertsPanel({
  initialAlerts,
  regions,
}: {
  initialAlerts: AlertWithRegionDTO[];
  regions: RegionOption[];
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const [regionId, setRegionId] = useState(regions[0]?.id ?? "");
  const [heatIndex, setHeatIndex] = useState(48);
  const [isSimulating, startSimulate] = useTransition();

  function showToast(title: string, body: string) {
    const next: Toast = { id: Date.now(), title, body };
    setToast(next);
    window.setTimeout(() => {
      setToast((current) => (current?.id === next.id ? null : current));
    }, 6000);
  }

  async function acknowledge(id: string) {
    const previous = alerts;
    setPendingIds((set) => new Set(set).add(id));
    // Optimistic: mark inactive immediately.
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, active: false } : alert,
      ),
    );
    try {
      await acknowledgeAlert(id);
    } catch (error) {
      setAlerts(previous); // rollback
      showToast(
        "Acknowledge failed",
        error instanceof ApiClientError ? error.message : "Please try again.",
      );
    } finally {
      setPendingIds((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
  }

  function simulate() {
    startSimulate(async () => {
      try {
        const created = await createAlert({ regionId, heatIndexC: heatIndex });
        setAlerts((current) => [created, ...current]);
        showToast(
          `${created.level} alert · ${created.region.name}`,
          created.message,
        );
      } catch (error) {
        showToast(
          "Simulation failed",
          error instanceof ApiClientError ? error.message : "Please try again.",
        );
      }
    });
  }

  const previewLevel = classifyAlertLevel(heatIndex);
  const fieldClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        >
          <div className="flex items-start gap-2">
            <Bell
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {toast.body}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Simulated notification — no real SMS/push sent
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="ml-auto rounded p-0.5 text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Alert feed</h2>
            <p className="text-xs text-muted-foreground">
              Active alerts first, then recent.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="sim-region"
                className="text-xs text-muted-foreground"
              >
                Region
              </label>
              <select
                id="sim-region"
                value={regionId}
                onChange={(event) => setRegionId(event.target.value)}
                className={`${fieldClass} w-36`}
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="sim-heat"
                className="text-xs text-muted-foreground"
              >
                Heat index °C
              </label>
              <input
                id="sim-heat"
                type="number"
                min={0}
                max={70}
                step={0.5}
                value={heatIndex}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setHeatIndex(Number.isFinite(value) ? value : 0);
                }}
                className={`${fieldClass} w-24`}
              />
            </div>
            <div className="flex items-center gap-2">
              <AlertBadge level={previewLevel} />
              <Button
                size="sm"
                disabled={isSimulating || !regionId}
                onClick={simulate}
              >
                <Send className="size-4" aria-hidden />
                {isSimulating ? "Simulating…" : "Simulate alert"}
              </Button>
            </div>
          </div>
        </div>

        {alerts.length === 0 ? (
          <DataEmptyState
            className="mt-4"
            title="No alerts"
            description="No active or recent alerts. Simulate one to see the flow."
          />
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {alerts.map((alert) => (
              <AlertFeedItem
                key={alert.id}
                alert={alert}
                onAcknowledge={acknowledge}
                isPending={pendingIds.has(alert.id)}
              />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

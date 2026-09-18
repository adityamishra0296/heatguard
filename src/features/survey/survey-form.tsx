"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSurveySchema, type CreateSurveyInput } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

interface RegionOption {
  id: string;
  name: string;
  state: string;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  regionId: "Please select a region.",
  awarenessLevel: "Please select an awareness level (1–5).",
  notes: "Notes must be 1000 characters or fewer.",
};

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

/** Accessible field-survey form. Validates with zod, then calls `onSubmit`
 *  (which persists + optimistically updates the table). Rejections surface as
 *  a form error; resolutions reset the form and show a confirmation. */
export function SurveyForm({
  regions,
  onSubmit,
}: {
  regions: RegionOption[];
  onSubmit: (values: CreateSurveyInput) => Promise<void>;
}) {
  const [regionId, setRegionId] = useState("");
  const [awareness, setAwareness] = useState<number | null>(null);
  const [hasHeatPlan, setHasHeatPlan] = useState(false);
  const [accessToShade, setAccessToShade] = useState(false);
  const [accessToWater, setAccessToWater] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!confirmed) return;
    const timer = window.setTimeout(() => setConfirmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmed]);

  const grouped = new Map<string, RegionOption[]>();
  for (const region of regions) {
    const list = grouped.get(region.state) ?? [];
    list.push(region);
    grouped.set(region.state, list);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmed(false);

    const parsed = createSurveySchema.safeParse({
      regionId,
      awarenessLevel: awareness ?? undefined,
      hasHeatPlan,
      accessToShade,
      accessToDrinkingWater: accessToWater,
      notes: notes.trim() || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key])
          fieldErrors[key] = FRIENDLY_ERRORS[key] ?? issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      setAwareness(null);
      setHasHeatPlan(false);
      setAccessToShade(false);
      setAccessToWater(false);
      setNotes("");
      setConfirmed(true);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Submission failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Record a survey response</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Field data-collection form.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-4"
        noValidate
      >
        {/* Region */}
        <div className="flex flex-col gap-1">
          <label htmlFor="survey-region" className="text-sm font-medium">
            Region
          </label>
          <select
            id="survey-region"
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            aria-invalid={Boolean(errors.regionId)}
            aria-describedby={
              errors.regionId ? "survey-region-error" : undefined
            }
            className={fieldClass}
          >
            <option value="">Select a region…</option>
            {[...grouped.entries()].map(([state, items]) => (
              <optgroup key={state} label={state}>
                {items.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.regionId ? (
            <p
              id="survey-region-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.regionId}
            </p>
          ) : null}
        </div>

        {/* Awareness level */}
        <fieldset>
          <legend className="text-sm font-medium">
            Awareness level{" "}
            <span className="font-normal text-muted-foreground">
              (1 = low, 5 = high)
            </span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Awareness level"
            aria-describedby={
              errors.awarenessLevel ? "survey-awareness-error" : undefined
            }
            className="mt-1.5 flex gap-2"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <label
                key={level}
                className={cn(
                  "flex size-9 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  awareness === level
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name="awareness"
                  value={level}
                  checked={awareness === level}
                  onChange={() => setAwareness(level)}
                  className="sr-only"
                />
                {level}
              </label>
            ))}
          </div>
          {errors.awarenessLevel ? (
            <p
              id="survey-awareness-error"
              role="alert"
              className="mt-1 text-xs text-destructive"
            >
              {errors.awarenessLevel}
            </p>
          ) : null}
        </fieldset>

        {/* Booleans */}
        <div className="flex flex-col gap-2">
          {[
            {
              id: "heatplan",
              label: "A heat action plan exists",
              checked: hasHeatPlan,
              set: setHasHeatPlan,
            },
            {
              id: "shade",
              label: "Access to shade",
              checked: accessToShade,
              set: setAccessToShade,
            },
            {
              id: "water",
              label: "Access to drinking water",
              checked: accessToWater,
              set: setAccessToWater,
            },
          ].map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.set(e.target.checked)}
                className="size-4 rounded border-input accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {item.label}
            </label>
          ))}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label htmlFor="survey-notes" className="text-sm font-medium">
            Notes{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            id="survey-notes"
            value={notes}
            maxLength={1000}
            rows={3}
            onChange={(e) => setNotes(e.target.value)}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "survey-notes-error" : undefined}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Observations from the field…"
          />
          {errors.notes ? (
            <p
              id="survey-notes-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.notes}
            </p>
          ) : null}
        </div>

        {errors.form ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {errors.form}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            <Send className="size-4" aria-hidden />
            {submitting ? "Submitting…" : "Submit response"}
          </Button>
          {confirmed ? (
            <span
              role="status"
              className="flex items-center gap-1 text-sm text-heat-normal"
            >
              <Check className="size-4" aria-hidden />
              Response recorded
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

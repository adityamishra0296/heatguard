import { z } from "zod";

/**
 * Zod schemas for validating API inputs. Query values arrive as strings, so
 * dates are coerced and booleans are parsed from their string forms.
 */

/** ISO date string (or timestamp) coerced to a Date; rejects invalid dates. */
const isoDate = z.coerce.date();

const regionId = z.string().trim().min(1, "regionId is required.");

/** `?regionId&from&to` — used by the readings and recovery endpoints. */
export const regionRangeQuerySchema = z
  .object({
    regionId,
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "`from` must be on or before `to`.",
    path: ["from"],
  });

export type RegionRangeQuery = z.infer<typeof regionRangeQuerySchema>;

/** `/regions/:id?from&to` — optional date window for the detail series. */
export const regionDetailQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "`from` must be on or before `to`.",
    path: ["from"],
  });

export type RegionDetailQuery = z.infer<typeof regionDetailQuerySchema>;

/** `?active=true|false` — filters the alerts endpoint. */
export const alertsQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export type AlertsQuery = z.infer<typeof alertsQuerySchema>;

/** Body for `POST /surveys`. */
export const createSurveySchema = z.object({
  regionId,
  awarenessLevel: z
    .number()
    .int("awarenessLevel must be an integer.")
    .min(1, "awarenessLevel must be between 1 and 5.")
    .max(5, "awarenessLevel must be between 1 and 5."),
  hasHeatPlan: z.boolean(),
  accessToShade: z.boolean(),
  accessToDrinkingWater: z.boolean(),
  notes: z
    .string()
    .trim()
    .max(1000, "notes must be 1000 characters or fewer.")
    .optional(),
  submittedAt: isoDate.optional(),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

/** Body for `POST /alerts` (simulate an alert). */
export const createAlertSchema = z.object({
  regionId,
  heatIndexC: z
    .number()
    .min(-30, "heatIndexC is out of range.")
    .max(80, "heatIndexC is out of range."),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

/** Body for `PATCH /alerts/:id` (acknowledge / reactivate). */
export const updateAlertSchema = z.object({
  active: z.boolean(),
});

export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;

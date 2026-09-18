import type { NextRequest } from "next/server";

import {
  apiSuccess,
  handleRoute,
  parseJsonBody,
  parseQuery,
} from "@/lib/api/http";
import { alertsQuerySchema, createAlertSchema } from "@/lib/api/schemas";
import { createAlert, getAlerts } from "@/server/alerts";

/** GET /api/alerts?active=true — heat alerts, optionally only active ones. */
export async function GET(req: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    const { active } = parseQuery(req, alertsQuerySchema);
    return apiSuccess(await getAlerts({ active }));
  });
}

/** POST /api/alerts — create (simulate) an alert from a region + heat index. */
export async function POST(req: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    const input = await parseJsonBody(req, createAlertSchema);
    return apiSuccess(await createAlert(input), 201);
  });
}

import type { NextRequest } from "next/server";

import { apiSuccess, handleRoute, parseQuery } from "@/lib/api/http";
import { regionRangeQuerySchema } from "@/lib/api/schemas";
import { getReadings } from "@/server/readings";

/** GET /api/readings?regionId&from&to — a region's temperature readings. */
export async function GET(req: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    const { regionId, from, to } = parseQuery(req, regionRangeQuerySchema);
    return apiSuccess(await getReadings({ regionId, from, to }));
  });
}

import type { NextRequest } from "next/server";

import { apiSuccess, handleRoute, parseQuery } from "@/lib/api/http";
import { regionRangeQuerySchema } from "@/lib/api/schemas";
import { getRecovery } from "@/server/recovery";

/** GET /api/recovery?regionId&from&to — a region's recovery indicators. */
export async function GET(req: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    const { regionId, from, to } = parseQuery(req, regionRangeQuerySchema);
    return apiSuccess(await getRecovery({ regionId, from, to }));
  });
}

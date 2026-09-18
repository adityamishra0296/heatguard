import type { NextRequest } from "next/server";

import { apiSuccess, handleRoute, parseQuery } from "@/lib/api/http";
import { regionDetailQuerySchema } from "@/lib/api/schemas";
import { getRegionDetail } from "@/server/regions";

/** GET /api/regions/:id — full detail (readings, alerts, vulnerability, recovery, surveys). */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await ctx.params;
    const { from, to } = parseQuery(req, regionDetailQuerySchema);
    return apiSuccess(await getRegionDetail(id, { from, to }));
  });
}

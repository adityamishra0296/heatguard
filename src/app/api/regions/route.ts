import { apiSuccess, handleRoute } from "@/lib/api/http";
import { getRegionsOverview } from "@/server/regions";

/** GET /api/regions — all regions with latest reading, active alert, and scores. */
export async function GET(): Promise<Response> {
  return handleRoute(async () => apiSuccess(await getRegionsOverview()));
}

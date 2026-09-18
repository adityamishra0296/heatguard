import type { NextRequest } from "next/server";

import { apiSuccess, handleRoute, parseJsonBody } from "@/lib/api/http";
import { updateAlertSchema } from "@/lib/api/schemas";
import { setAlertActive } from "@/server/alerts";

/** PATCH /api/alerts/:id — update an alert's active flag (acknowledge). */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await ctx.params;
    const { active } = await parseJsonBody(req, updateAlertSchema);
    return apiSuccess(await setAlertActive(id, active));
  });
}

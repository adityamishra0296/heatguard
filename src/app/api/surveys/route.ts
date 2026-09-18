import type { NextRequest } from "next/server";

import { apiSuccess, handleRoute, parseJsonBody } from "@/lib/api/http";
import { createSurveySchema } from "@/lib/api/schemas";
import { createSurvey } from "@/server/surveys";

/** POST /api/surveys — create a survey response (validated with zod). */
export async function POST(req: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    const input = await parseJsonBody(req, createSurveySchema);
    return apiSuccess(await createSurvey(input), 201);
  });
}

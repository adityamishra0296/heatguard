import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/surveys", () => ({
  createSurvey: vi.fn(),
}));

import { POST as postSurvey } from "@/app/api/surveys/route";
import { createSurvey } from "@/server/surveys";

const mockCreate = vi.mocked(createSurvey);

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/surveys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  regionId: "r1",
  awarenessLevel: 4,
  hasHeatPlan: true,
  accessToShade: false,
  accessToDrinkingWater: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/surveys", () => {
  it("creates a survey and returns 201 with the envelope", async () => {
    mockCreate.mockResolvedValue({ id: "s1", ...validBody } as never);

    const res = await postSurvey(jsonRequest(validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe("s1");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("returns 400 for an invalid body and never touches the data layer", async () => {
    const res = await postSurvey(
      jsonRequest({ ...validBody, awarenessLevel: 9 }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const req = new NextRequest("http://localhost/api/surveys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await postSurvey(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_JSON");
  });
});

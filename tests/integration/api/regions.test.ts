import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the data layer so these tests exercise the real route handlers, HTTP
// envelope, and error mapping without a database.
vi.mock("@/server/regions", () => ({
  getRegionsOverview: vi.fn(),
  getRegionDetail: vi.fn(),
}));

import { GET as getRegion } from "@/app/api/regions/[id]/route";
import { GET as getRegions } from "@/app/api/regions/route";
import { NotFoundError } from "@/lib/api/http";
import { getRegionDetail, getRegionsOverview } from "@/server/regions";

const mockOverview = vi.mocked(getRegionsOverview);
const mockDetail = vi.mocked(getRegionDetail);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/regions", () => {
  it("wraps the overview in a success envelope", async () => {
    mockOverview.mockResolvedValue([
      { id: "r1", name: "Test", state: "Delhi" },
    ] as never);

    const res = await getRegions();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      data: [{ id: "r1", name: "Test", state: "Delhi" }],
    });
  });
});

describe("GET /api/regions/:id", () => {
  it("returns the region detail on success", async () => {
    mockDetail.mockResolvedValue({ region: { id: "r1" } } as never);

    const req = new NextRequest("http://localhost/api/regions/r1");
    const res = await getRegion(req, { params: Promise.resolve({ id: "r1" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockDetail).toHaveBeenCalledWith("r1", {
      from: undefined,
      to: undefined,
    });
  });

  it("maps NotFoundError to a 404 envelope", async () => {
    mockDetail.mockRejectedValue(
      new NotFoundError("Region 'nope' was not found."),
    );

    const req = new NextRequest("http://localhost/api/regions/nope");
    const res = await getRegion(req, {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("rejects an inverted date range with a 400 validation error", async () => {
    const req = new NextRequest(
      "http://localhost/api/regions/r1?from=2026-05-10&to=2026-05-01",
    );
    const res = await getRegion(req, { params: Promise.resolve({ id: "r1" }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockDetail).not.toHaveBeenCalled();
  });
});

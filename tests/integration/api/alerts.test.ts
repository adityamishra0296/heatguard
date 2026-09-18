import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/alerts", () => ({
  getAlerts: vi.fn(),
  createAlert: vi.fn(),
  setAlertActive: vi.fn(),
}));

import { PATCH as patchAlert } from "@/app/api/alerts/[id]/route";
import { GET as getAlerts, POST as postAlert } from "@/app/api/alerts/route";
import {
  createAlert,
  getAlerts as getAlertsService,
  setAlertActive,
} from "@/server/alerts";

const mockGet = vi.mocked(getAlertsService);
const mockCreate = vi.mocked(createAlert);
const mockSetActive = vi.mocked(setAlertActive);

function jsonRequest(url: string, body: unknown, method = "POST"): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/alerts", () => {
  it("passes the parsed active filter through and returns the feed", async () => {
    mockGet.mockResolvedValue([{ id: "a1" }] as never);

    const res = await getAlerts(
      new NextRequest("http://localhost/api/alerts?active=true"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([{ id: "a1" }]);
    expect(mockGet).toHaveBeenCalledWith({ active: true });
  });

  it("rejects an invalid active value", async () => {
    const res = await getAlerts(
      new NextRequest("http://localhost/api/alerts?active=maybe"),
    );
    expect(res.status).toBe(400);
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe("POST /api/alerts", () => {
  it("creates an alert and returns 201", async () => {
    mockCreate.mockResolvedValue({ id: "a1", level: "ORANGE" } as never);

    const res = await postAlert(
      jsonRequest("http://localhost/api/alerts", {
        regionId: "r1",
        heatIndexC: 42,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.level).toBe("ORANGE");
  });

  it("rejects an out-of-range heat index", async () => {
    const res = await postAlert(
      jsonRequest("http://localhost/api/alerts", {
        regionId: "r1",
        heatIndexC: 999,
      }),
    );
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/alerts/:id", () => {
  it("updates the active flag", async () => {
    mockSetActive.mockResolvedValue({ id: "a1", active: false } as never);

    const res = await patchAlert(
      jsonRequest("http://localhost/api/alerts/a1", { active: false }, "PATCH"),
      { params: Promise.resolve({ id: "a1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.active).toBe(false);
    expect(mockSetActive).toHaveBeenCalledWith("a1", false);
  });

  it("rejects a non-boolean active flag", async () => {
    const res = await patchAlert(
      jsonRequest("http://localhost/api/alerts/a1", { active: "off" }, "PATCH"),
      { params: Promise.resolve({ id: "a1" }) },
    );
    expect(res.status).toBe(400);
    expect(mockSetActive).not.toHaveBeenCalled();
  });
});

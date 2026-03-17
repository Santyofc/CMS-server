import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("@/packages/db", () => ({
  getDb: () => ({
    execute
  })
}));

describe("readiness route", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("returns 200 when db is reachable", async () => {
    execute.mockResolvedValue([{ "?column?": 1 }]);
    const { GET } = await import("@/app/api/readiness/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ready",
      checks: { database: "ok" }
    });
  });

  it("returns 503 when db is unavailable", async () => {
    execute.mockRejectedValue(new Error("db down"));
    const { GET } = await import("@/app/api/readiness/route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "not_ready",
      checks: { database: "error" },
      error: "Database unavailable"
    });
  });
});

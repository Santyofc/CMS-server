import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const loginWithEmailPassword = vi.fn();
const checkRateLimit = vi.fn();

vi.mock("@/lib/security/auth", () => ({
  loginWithEmailPassword
}));

vi.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit
}));

describe("login route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("APP_URL", "https://cms.zonasurtech.online");
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    loginWithEmailPassword.mockReset();
  });

  it("returns a sanitized error when auth throws", async () => {
    loginWithEmailPassword.mockRejectedValue(new Error("database exploded"));
    const { POST } = await import("@/app/api/auth/login/route");

    const request = new NextRequest("https://cms.zonasurtech.online/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online",
        "content-type": "application/json"
      },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Login failed" });
  });

  it("blocks requests after rate limit denial", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 60_000 });
    const { POST } = await import("@/app/api/auth/login/route");

    const request = new NextRequest("https://cms.zonasurtech.online/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online",
        "content-type": "application/json"
      },
      body: JSON.stringify({ email: "admin@example.com", password: "password123" })
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: "Too many login attempts" });
  });
});

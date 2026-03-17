import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { enforceSameOrigin } from "@/lib/security/request-integrity";

describe("request integrity", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows same-origin requests", () => {
    vi.stubEnv("APP_URL", "https://cms.zonasurtech.online");
    const request = new NextRequest("https://cms.zonasurtech.online/api/deploy", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online"
      }
    });

    const result = enforceSameOrigin(request);
    expect(result.ok).toBe(true);
  });

  it("blocks cross-origin requests", async () => {
    vi.stubEnv("APP_URL", "https://cms.zonasurtech.online");
    const request = new NextRequest("https://cms.zonasurtech.online/api/deploy", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        host: "cms.zonasurtech.online"
      }
    });

    const result = enforceSameOrigin(request);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected same-origin rejection.");
    }

    expect(result.response.status).toBe(403);
    await expect(result.response.json()).resolves.toEqual({ error: "Cross-origin requests are not allowed" });
  });
});

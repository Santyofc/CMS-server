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

  it("allows trusted proxy headers with comma-separated proto values", () => {
    vi.stubEnv("APP_URL", "https://cms.zonasurtech.online");
    vi.stubEnv("TRUST_PROXY", "true");
    const request = new NextRequest("http://127.0.0.1:3001/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "127.0.0.1:3001",
        "x-forwarded-host": "cms.zonasurtech.online",
        "x-forwarded-proto": "http, https"
      }
    });

    const result = enforceSameOrigin(request);
    expect(result.ok).toBe(true);
  });

  it("blocks trusted proxy requests when forwarded proto chain does not include origin protocol", async () => {
    vi.stubEnv("APP_URL", "https://cms.zonasurtech.online");
    vi.stubEnv("TRUST_PROXY", "true");
    const request = new NextRequest("http://127.0.0.1:3001/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "127.0.0.1:3001",
        "x-forwarded-host": "cms.zonasurtech.online",
        "x-forwarded-proto": "http"
      }
    });

    const result = enforceSameOrigin(request);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected protocol mismatch rejection.");
    }

    expect(result.response.status).toBe(403);
    await expect(result.response.json()).resolves.toEqual({ error: "Protocol mismatch" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("rate limit", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("allows until the limit in development fallback", async () => {
    const first = await checkRateLimit("test:dev", 2, 60_000);
    const second = await checkRateLimit("test:dev", 2, 60_000);
    const third = await checkRateLimit("test:dev", 2, 60_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("fails closed in production when redis is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REDIS_URL", "");

    const result = await checkRateLimit("test:prod", 2, 60_000);
    expect(result.allowed).toBe(false);
  });
});

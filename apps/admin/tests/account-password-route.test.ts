import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocked = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  loginWithEmailPassword: vi.fn(),
  changeOwnPassword: vi.fn(),
  writeAuditLog: vi.fn()
}));

vi.mock("@/lib/security/auth", () => ({
  requireApiUser: mocked.requireApiUser,
  loginWithEmailPassword: mocked.loginWithEmailPassword
}));

vi.mock("@/lib/security/request-integrity", () => ({
  enforceSameOrigin: () => ({ ok: true })
}));

vi.mock("@/lib/security/request-meta", () => ({
  getRequestAuditMeta: () => ({
    ip: "127.0.0.1",
    userAgent: "vitest",
    requestId: "req-password"
  })
}));

vi.mock("@/lib/security/audit", () => ({
  writeAuditLog: mocked.writeAuditLog
}));

vi.mock("@/lib/security/logger", () => ({
  logError: vi.fn()
}));

vi.mock("@/lib/services/users", () => ({
  changeOwnPassword: mocked.changeOwnPassword,
  UserServiceError: class UserServiceError extends Error {
    constructor(message: string, public readonly statusCode: number) {
      super(message);
    }
  }
}));

describe("account password route", () => {
  beforeEach(() => {
    vi.resetModules();
    mocked.requireApiUser.mockReset();
    mocked.loginWithEmailPassword.mockReset();
    mocked.changeOwnPassword.mockReset();
    mocked.writeAuditLog.mockReset();
    mocked.requireApiUser.mockResolvedValue({
      ok: true,
      user: {
        id: 9,
        email: "operator@example.com",
        role: "operator",
        mustChangePassword: true
      }
    });
  });

  it("changes password and refreshes session", async () => {
    mocked.changeOwnPassword.mockResolvedValue(undefined);
    mocked.loginWithEmailPassword.mockResolvedValue({
      id: 9,
      email: "operator@example.com",
      role: "operator",
      mustChangePassword: false
    });

    const { POST } = await import("@/app/api/account/password/route");
    const request = new NextRequest("https://cms.zonasurtech.online/api/account/password", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        currentPassword: "Temp123456",
        nextPassword: "NewPassword123"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        user: {
          email: "operator@example.com",
          mustChangePassword: false
        }
      }
    });
  });
});

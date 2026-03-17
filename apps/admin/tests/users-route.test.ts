import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocked = vi.hoisted(() => {
  class MockUserServiceError extends Error {
    constructor(message: string, public readonly statusCode: number) {
      super(message);
    }
  }

  return {
    requireApiUser: vi.fn(),
    createUser: vi.fn(),
    listUsers: vi.fn(),
    writeAuditLog: vi.fn(),
    MockUserServiceError
  };
});

vi.mock("@/lib/security/auth", () => ({
  requireApiUser: mocked.requireApiUser
}));

vi.mock("@/lib/security/request-integrity", () => ({
  enforceSameOrigin: () => ({ ok: true })
}));

vi.mock("@/lib/security/request-meta", () => ({
  getRequestAuditMeta: () => ({
    ip: "127.0.0.1",
    userAgent: "vitest",
    requestId: "req-1"
  })
}));

vi.mock("@/lib/security/audit", () => ({
  writeAuditLog: mocked.writeAuditLog
}));

vi.mock("@/lib/security/logger", () => ({
  logError: vi.fn()
}));

vi.mock("@/lib/services/users", () => {
  return {
    UserServiceError: mocked.MockUserServiceError,
    createUser: mocked.createUser,
    listUsers: mocked.listUsers,
    getUserRoles: () => ["owner", "admin", "operator", "viewer"]
  };
});

describe("users routes", () => {
  beforeEach(() => {
    vi.resetModules();
    mocked.requireApiUser.mockReset();
    mocked.createUser.mockReset();
    mocked.listUsers.mockReset();
    mocked.writeAuditLog.mockReset();
    mocked.requireApiUser.mockResolvedValue({
      ok: true,
      user: { id: 1, email: "owner@example.com", role: "owner" }
    });
  });

  it("creates a user with valid payload", async () => {
    mocked.createUser.mockResolvedValue({
      id: 2,
      email: "ops@example.com",
      role: "operator",
      isActive: true,
      createdAt: new Date().toISOString()
    });

    const { POST } = await import("@/app/api/users/route");
    const request = new NextRequest("https://cms.zonasurtech.online/api/users", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "ops@example.com",
        password: "password1234",
        role: "operator"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        email: "ops@example.com",
        role: "operator"
      }
    });
  });

  it("rejects duplicate email with a controlled error", async () => {
    mocked.createUser.mockRejectedValue(new mocked.MockUserServiceError("Ya existe un usuario con ese email", 409));

    const { POST } = await import("@/app/api/users/route");
    const request = new NextRequest("https://cms.zonasurtech.online/api/users", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "ops@example.com",
        password: "password1234",
        role: "operator"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Ya existe un usuario con ese email" });
  });

  it("rejects invalid roles before hitting the service", async () => {
    const { POST } = await import("@/app/api/users/route");
    const request = new NextRequest("https://cms.zonasurtech.online/api/users", {
      method: "POST",
      headers: {
        origin: "https://cms.zonasurtech.online",
        host: "cms.zonasurtech.online",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "ops@example.com",
        password: "password1234",
        role: "invalid-role"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mocked.createUser).not.toHaveBeenCalled();
  });
});

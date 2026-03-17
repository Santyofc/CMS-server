import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn()
};

const selectWhere = vi.fn();
const deleteWhere = vi.fn();
const insertValues = vi.fn();
const verifyPassword = vi.fn();

const db = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: selectWhere
    }))
  })),
  delete: vi.fn(() => ({
    where: deleteWhere
  })),
  insert: vi.fn(() => ({
    values: insertValues
  }))
};

vi.mock("next/headers", () => ({
  cookies: () => cookieStore
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => args,
  eq: (...args: unknown[]) => ({ operator: "eq", args }),
  gt: (...args: unknown[]) => ({ operator: "gt", args })
}));

vi.mock("@/packages/db", () => ({
  getDb: () => db,
  sessions: {
    user_id: "user_id",
    token: "token",
    expires_at: "expires_at"
  },
  users: {
    id: "id",
    email: "email",
    role: "role",
    is_active: "is_active"
  }
}));

vi.mock("@/lib/security/password", () => ({
  verifyPassword
}));

describe("auth service", () => {
  beforeEach(() => {
    vi.resetModules();
    cookieStore.set.mockReset();
    cookieStore.get.mockReset();
    cookieStore.delete.mockReset();
    selectWhere.mockReset();
    deleteWhere.mockReset();
    insertValues.mockReset();
    verifyPassword.mockReset();
  });

  it("logs in an active user and writes a session cookie", async () => {
    selectWhere.mockResolvedValue([
      {
        id: 5,
        email: "owner@example.com",
        role: "superadmin",
        password_hash: "stored",
        is_active: true,
        created_at: new Date()
      }
    ]);
    verifyPassword.mockReturnValue(true);
    deleteWhere.mockResolvedValue(undefined);
    insertValues.mockResolvedValue(undefined);

    const { loginWithEmailPassword } = await import("@/lib/security/auth");
    const user = await loginWithEmailPassword("owner@example.com", "password1234");

    expect(user).toEqual({
      id: 5,
      email: "owner@example.com",
      role: "owner"
    });
    expect(cookieStore.set).toHaveBeenCalledOnce();
  });

  it("rejects inactive users", async () => {
    selectWhere.mockResolvedValue([]);
    const { loginWithEmailPassword } = await import("@/lib/security/auth");
    const user = await loginWithEmailPassword("inactive@example.com", "password1234");

    expect(user).toBeNull();
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(verifyPassword).not.toHaveBeenCalled();
  });
});

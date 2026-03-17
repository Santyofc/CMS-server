import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getDb, sessions, users } from "@/packages/db";
import { verifyPassword } from "@/lib/security/password";
import { hasMinRole as hasRequiredRole, normalizeRole, type Role } from "@/lib/security/roles";

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
};

const SESSION_COOKIE = "cms_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hasMinRole(user: AuthUser, minRole: Role) {
  return hasRequiredRole(user.role, minRole);
}

export async function loginWithEmailPassword(email: string, password: string): Promise<AuthUser | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.is_active, true)));

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  const token = randomUUID();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Rotate existing active sessions for this user.
  await db.delete(sessions).where(eq(sessions.user_id, user.id));

  await db.insert(sessions).values({
    user_id: user.id,
    token: tokenHash,
    expires_at: expiresAt
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  return {
    id: user.id,
    email: user.email,
    role: normalizeRole(user.role)
  };
}

export async function logoutCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return;
  }

  const db = getDb();
  await db.delete(sessions).where(eq(sessions.token, hashSessionToken(token)));
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const tokenHash = hashSessionToken(token);

  const db = getDb();
  const [session] = await db
    .select({
      user_id: sessions.user_id,
      email: users.email,
      role: users.role,
      expires_at: sessions.expires_at
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.user_id))
    .where(and(eq(sessions.token, tokenHash), gt(sessions.expires_at, new Date()), eq(users.is_active, true)));

  if (!session) {
    return null;
  }

  return {
    id: session.user_id,
    email: session.email,
    role: normalizeRole(session.role)
  };
}

export async function requireApiUser(minRole: Role = "viewer") {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  if (!hasMinRole(user, minRole)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return {
    ok: true as const,
    user
  };
}

export async function requirePageUser(minRole: Role = "viewer") {
  const user = await getCurrentUser();
  if (!user || !hasMinRole(user, minRole)) {
    return null;
  }

  return user;
}

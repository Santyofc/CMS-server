import { and, desc, eq, or } from "drizzle-orm";
import { getDb, users } from "@/packages/db";
import { hashPassword } from "@/lib/security/password";
import {
  APP_ROLES,
  LEGACY_OWNER_ROLE,
  canAssignRole,
  canManageTarget,
  normalizeRole,
  serializeRole,
  type Role
} from "@/lib/security/roles";

export type UserListFilters = {
  role?: Role | "all";
  status?: "all" | "active" | "inactive";
};

export type UserRecord = {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

type CreateUserInput = {
  email: string;
  password: string;
  role: Role;
};

export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(record: typeof users.$inferSelect): UserRecord {
  return {
    id: record.id,
    email: record.email,
    role: normalizeRole(record.role),
    isActive: record.is_active,
    createdAt: record.created_at.toISOString()
  };
}

export async function listUsers(filters: UserListFilters = {}): Promise<UserRecord[]> {
  const db = getDb();
  const clauses = [];

  if (filters.role && filters.role !== "all") {
    clauses.push(
      filters.role === "owner"
        ? or(eq(users.role, "owner"), eq(users.role, LEGACY_OWNER_ROLE))
        : eq(users.role, serializeRole(filters.role))
    );
  }

  if (filters.status === "active") {
    clauses.push(eq(users.is_active, true));
  }

  if (filters.status === "inactive") {
    clauses.push(eq(users.is_active, false));
  }

  const query = db.select().from(users).orderBy(desc(users.created_at));
  const rows = clauses.length > 0 ? await query.where(and(...clauses)) : await query;
  return rows.map(mapUser);
}

export async function createUser(actor: { id: number; role: Role }, input: CreateUserInput): Promise<UserRecord> {
  if (!canAssignRole(actor.role, input.role)) {
    throw new UserServiceError("No tienes permisos para asignar ese rol", 403);
  }

  const db = getDb();
  const email = normalizeEmail(input.email);
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    throw new UserServiceError("Ya existe un usuario con ese email", 409);
  }

  const [created] = await db.insert(users).values({
    email,
    password_hash: hashPassword(input.password),
    role: serializeRole(input.role),
    is_active: true
  }).returning();

  return mapUser(created);
}

async function getUserById(id: number) {
  const db = getDb();
  const [record] = await db.select().from(users).where(eq(users.id, id));
  if (!record) {
    throw new UserServiceError("Usuario no encontrado", 404);
  }

  return record;
}

export async function updateUserRole(
  actor: { id: number; role: Role },
  targetUserId: number,
  nextRole: Role
): Promise<UserRecord> {
  const target = await getUserById(targetUserId);
  const targetRole = normalizeRole(target.role);

  if (!canManageTarget(actor.role, targetRole) || !canAssignRole(actor.role, nextRole)) {
    throw new UserServiceError("No tienes permisos para actualizar este usuario", 403);
  }

  if (actor.id === targetUserId && actor.role !== "owner") {
    throw new UserServiceError("No puedes cambiar tu propio rol", 400);
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ role: serializeRole(nextRole) })
    .where(eq(users.id, targetUserId))
    .returning();

  return mapUser(updated);
}

export async function updateUserStatus(
  actor: { id: number; role: Role },
  targetUserId: number,
  isActive: boolean
): Promise<UserRecord> {
  const target = await getUserById(targetUserId);
  const targetRole = normalizeRole(target.role);

  if (!canManageTarget(actor.role, targetRole)) {
    throw new UserServiceError("No tienes permisos para actualizar este usuario", 403);
  }

  if (actor.id === targetUserId) {
    throw new UserServiceError("No puedes desactivar tu propia sesión operativa", 400);
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ is_active: isActive })
    .where(eq(users.id, targetUserId))
    .returning();

  return mapUser(updated);
}

export function getUserRoles() {
  return [...APP_ROLES];
}

import { z } from "zod";

export const APP_ROLES = ["owner", "admin", "operator", "viewer"] as const;
export const LEGACY_OWNER_ROLE = "superadmin" as const;

export const roleSchema = z.enum(APP_ROLES);

export type Role = (typeof APP_ROLES)[number];
export type StoredRole = Role | typeof LEGACY_OWNER_ROLE;

const rolePriority: Record<Role, number> = {
  owner: 4,
  admin: 3,
  operator: 2,
  viewer: 1
};

export function normalizeRole(role: string): Role {
  if (role === LEGACY_OWNER_ROLE) {
    return "owner";
  }

  if ((APP_ROLES as readonly string[]).includes(role)) {
    return role as Role;
  }

  return "viewer";
}

export function serializeRole(role: Role): StoredRole {
  return role;
}

export function getRoleRank(role: Role): number {
  return rolePriority[role];
}

export function hasMinRole(role: Role, minimum: Role): boolean {
  return getRoleRank(role) >= getRoleRank(minimum);
}

export function canAssignRole(actorRole: Role, nextRole: Role): boolean {
  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "admin") {
    return nextRole === "operator" || nextRole === "viewer";
  }

  return false;
}

export function canManageTarget(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "admin") {
    return targetRole === "operator" || targetRole === "viewer";
  }

  return false;
}

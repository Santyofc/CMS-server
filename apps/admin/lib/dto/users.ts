import type { Role } from "@/lib/security/roles";

export type UserListItemDto = {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/security/auth";
import type { Role } from "@/lib/security/roles";

export async function requirePageAccess(minRole: Role = "viewer") {
  const user = await requirePageUser(minRole);
  if (!user) {
    redirect("/login");
  }
  if (user.mustChangePassword) {
    redirect("/setup-password");
  }

  return user;
}

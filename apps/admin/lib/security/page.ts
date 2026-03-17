import { redirect } from "next/navigation";
import { requirePageUser, type Role } from "@/lib/security/auth";

export async function requirePageAccess(minRole: Role = "viewer") {
  const user = await requirePageUser(minRole);
  if (!user) {
    redirect("/login");
  }

  return user;
}

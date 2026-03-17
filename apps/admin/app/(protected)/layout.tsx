import React from "react";
import { requirePageAccess } from "@/lib/security/page";
import AppShell from "@/components/shell/app-shell";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageAccess("viewer");
  return <AppShell user={user}>{children}</AppShell>;
}

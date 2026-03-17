import React from "react";
import { requirePageAccess } from "@/lib/security/page";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requirePageAccess("viewer");
  return <>{children}</>;
}

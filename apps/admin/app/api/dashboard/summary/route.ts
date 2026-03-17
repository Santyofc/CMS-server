import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/services/dashboard";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await getDashboardSummary();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load dashboard summary" }, { status: 500 });
  }
}


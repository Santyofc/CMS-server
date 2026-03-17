import { NextResponse } from "next/server";
import { getSpaceMailStatus } from "@/lib/services/providers/spaceship";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  const data = await getSpaceMailStatus();
  return NextResponse.json({ data }, { status: 501 });
}

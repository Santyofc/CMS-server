import { NextResponse } from "next/server";
import { listSpaceshipDns } from "@/lib/services/providers/spaceship";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await listSpaceshipDns();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load domains";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

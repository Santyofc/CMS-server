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
    return NextResponse.json({ error: "Failed to load domains" }, { status: 500 });
  }
}


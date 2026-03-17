import { NextRequest, NextResponse } from "next/server";
import { listNeonProjects } from "@/lib/services/providers/neon";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await listNeonProjects();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Neon projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Use POST /api/providers/neon/actions for write operations." },
    { status: 405 }
  );
}

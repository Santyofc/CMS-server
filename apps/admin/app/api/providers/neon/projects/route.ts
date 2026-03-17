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
    return NextResponse.json({ error: "Failed to load Neon projects" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Use POST /api/providers/neon/actions for write operations." },
    { status: 405 }
  );
}


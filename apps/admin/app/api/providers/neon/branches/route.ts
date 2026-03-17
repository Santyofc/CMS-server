import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listNeonBranches } from "@/lib/services/providers/neon";
import { requireApiUser } from "@/lib/security/auth";

const querySchema = z.object({
  project_id: z.string().min(1)
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = querySchema.parse({
      project_id: request.nextUrl.searchParams.get("project_id")
    });

    const data = await listNeonBranches(payload.project_id);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load Neon branches" }, { status: 400 });
  }
}


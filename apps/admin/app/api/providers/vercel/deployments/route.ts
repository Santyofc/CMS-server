import { NextResponse } from "next/server";
import { listVercelDeployments } from "@/lib/services/providers/vercel";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await listVercelDeployments(50);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Vercel deployments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

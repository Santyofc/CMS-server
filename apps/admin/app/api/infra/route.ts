import { NextResponse } from "next/server";
import { listAwsInstances } from "@/lib/services/providers/aws";
import { requireApiUser } from "@/lib/security/auth";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await listAwsInstances();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load infra" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { awsMetricsQuerySchema } from "@/lib/config/env";
import { getAwsMetrics } from "@/lib/services/providers/aws";
import { requireApiUser } from "@/lib/security/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const payload = awsMetricsQuerySchema.parse({
      instance_id: searchParams.get("instance_id"),
      hours: searchParams.get("hours") ?? "24"
    });

    const data = await getAwsMetrics(payload.instance_id, payload.hours);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load AWS metrics";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

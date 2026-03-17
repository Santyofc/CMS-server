import { NextRequest, NextResponse } from "next/server";
import { syncAwsEc2 } from "@/lib/services/providers/aws";
import { requireApiUser } from "@/lib/security/auth";
import { writeAuditLog } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const meta = getRequestAuditMeta(request);
  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  const auth = await requireApiUser("operator");
  if (!auth.ok) {
    return auth.response;
  }

  const rate = await checkRateLimit(`sync-aws:${auth.user.id}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const data = await syncAwsEc2();
    const statusCode = data.status === "success" ? 200 : 500;
    await writeAuditLog({
      userId: auth.user.id,
      action: "sync_aws",
      provider: "aws",
      target: "ec2",
      result: data.status === "success" ? "success" : "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId,
      errorMessage: data.status === "success" ? undefined : "AWS sync returned failed status"
    });
    return NextResponse.json({ data }, { status: statusCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AWS sync failed";
    await writeAuditLog({
      userId: auth.user.id,
      action: "sync_aws",
      provider: "aws",
      target: "ec2",
      payloadSummary: { error: message },
      result: "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId,
      errorMessage: message
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



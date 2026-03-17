import { NextRequest, NextResponse } from "next/server";
import { awsActionSchema } from "@/lib/config/env";
import { runAwsInstanceAction } from "@/lib/services/providers/aws";
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

  const rate = checkRateLimit(`aws-action:${auth.user.id}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const payload = awsActionSchema.parse(body);
    const data = await runAwsInstanceAction(payload.action, payload.instance_id);

    await writeAuditLog({
      userId: auth.user.id,
      action: `aws_${payload.action}`,
      provider: "aws",
      target: payload.instance_id,
      payloadSummary: payload,
      result: "success",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed AWS action";
    await writeAuditLog({
      userId: auth.user.id,
      action: "aws_action",
      provider: "aws",
      target: "unknown",
      payloadSummary: { error: message },
      result: "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 400,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId,
      errorMessage: message
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

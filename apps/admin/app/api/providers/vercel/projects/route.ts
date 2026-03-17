import { NextRequest, NextResponse } from "next/server";
import { vercelRedeploySchema } from "@/lib/config/env";
import { listVercelProjects, redeployVercelDeployment } from "@/lib/services/providers/vercel";
import { requireApiUser } from "@/lib/security/auth";
import { writeAuditLog } from "@/lib/security/audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";

export async function GET() {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const data = await listVercelProjects();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Vercel projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const meta = getRequestAuditMeta(request);
  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  const auth = await requireApiUser("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const rate = checkRateLimit(`vercel-redeploy:${auth.user.id}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const payload = vercelRedeploySchema.parse(body);
    const data = await redeployVercelDeployment(payload.deployment_id);

    await writeAuditLog({
      userId: auth.user.id,
      action: "vercel_redeploy",
      provider: "vercel",
      target: payload.deployment_id,
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
    const message = error instanceof Error ? error.message : "Failed to redeploy Vercel deployment";
    await writeAuditLog({
      userId: auth.user.id,
      action: "vercel_redeploy",
      provider: "vercel",
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

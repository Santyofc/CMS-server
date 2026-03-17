import { NextRequest, NextResponse } from "next/server";
import { neonActionSchema } from "@/lib/config/env";
import { createNeonBranch, listNeonBranches } from "@/lib/services/providers/neon";
import { requireApiUser } from "@/lib/security/auth";
import { writeAuditLog } from "@/lib/security/audit";
import { errorResponse } from "@/lib/security/http";
import { logError } from "@/lib/security/logger";
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

  const auth = await requireApiUser("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const rate = await checkRateLimit(`neon-action:${auth.user.id}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const payload = neonActionSchema.parse(body);

    if (payload.action === "create_branch") {
      const data = await createNeonBranch(payload.project_id, payload.branch_name);
      await writeAuditLog({
        userId: auth.user.id,
        action: "neon_create_branch",
        provider: "neon",
        target: payload.project_id,
        payloadSummary: payload,
        result: "success",
        ip: meta.ip,
        userAgent: meta.userAgent,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
        requestId: meta.requestId
      });
      return NextResponse.json({ data });
    }

    const data = await listNeonBranches(payload.project_id);
    await writeAuditLog({
      userId: auth.user.id,
      action: "neon_list_branches",
      provider: "neon",
      target: payload.project_id,
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
    const message = error instanceof Error ? error.message : "Failed Neon action";
    logError({ route: "/api/providers/neon/actions", requestId: meta.requestId }, error, "neon action failed");
    await writeAuditLog({
      userId: auth.user.id,
      action: "neon_action",
      provider: "neon",
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
    return errorResponse("Failed Neon action", 400);
  }
}


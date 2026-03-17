import { NextRequest, NextResponse } from "next/server";
import { syncGithubRepos } from "@/lib/services/providers/github";
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

  const rate = checkRateLimit(`sync-github:${auth.user.id}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const data = await syncGithubRepos();
    const statusCode = data.status === "success" ? 200 : 500;
    await writeAuditLog({
      userId: auth.user.id,
      action: "sync_github",
      provider: "github",
      target: "repos",
      result: data.status === "success" ? "success" : "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId,
      errorMessage: data.status === "success" ? undefined : "GitHub sync returned failed status"
    });
    return NextResponse.json({ data }, { status: statusCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub sync failed";
    await writeAuditLog({
      userId: auth.user.id,
      action: "sync_github",
      provider: "github",
      target: "repos",
      payloadSummary: { error: message },
      result: "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 500,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId,
      errorMessage: message
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

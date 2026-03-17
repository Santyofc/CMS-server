import { NextRequest, NextResponse } from "next/server";
import { syncAwsEc2 } from "@/lib/services/providers/aws";
import { syncGithubRepos } from "@/lib/services/providers/github";
import { syncNeon } from "@/lib/services/providers/neon";
import { syncSpaceshipDns } from "@/lib/services/providers/spaceship";
import { syncVercel } from "@/lib/services/providers/vercel";
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

  const auth = await requireApiUser("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const rate = await checkRateLimit(`sync-all:${auth.user.id}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [aws, github, vercel, neon, spaceship] = await Promise.allSettled([
    syncAwsEc2(),
    syncGithubRepos(),
    syncVercel(),
    syncNeon(),
    syncSpaceshipDns()
  ]);

  const ok = [aws, github, vercel, neon, spaceship].every((result) => result.status === "fulfilled");
  await writeAuditLog({
    userId: auth.user.id,
    action: "sync_all",
    provider: "system",
    target: "all",
    payloadSummary: {},
    result: ok ? "success" : "fail",
    ip: meta.ip,
    userAgent: meta.userAgent,
    statusCode: ok ? 200 : 500,
    durationMs: Date.now() - startedAt,
    requestId: meta.requestId,
    errorMessage: ok ? undefined : "One or more sync jobs failed"
  });

  return NextResponse.json({
    data: {
      aws,
      github,
      vercel,
      neon,
      spaceship
    }
  });
}


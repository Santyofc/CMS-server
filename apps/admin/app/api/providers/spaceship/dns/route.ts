import { NextRequest, NextResponse } from "next/server";
import { spaceshipDnsWriteSchema } from "@/lib/config/env";
import { listSpaceshipDns, updateSpaceshipDns } from "@/lib/services/providers/spaceship";
import { requireApiUser } from "@/lib/security/auth";
import { writeAuditLog } from "@/lib/security/audit";
import { errorResponse } from "@/lib/security/http";
import { logError } from "@/lib/security/logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser("viewer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const domain = request.nextUrl.searchParams.get("domain") ?? undefined;
    const data = await listSpaceshipDns(domain);
    return NextResponse.json({ data });
  } catch (error) {
    logError({ route: "/api/providers/spaceship/dns" }, error, "spaceship dns read failed");
    return errorResponse("Failed to load Spaceship DNS", 500);
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

  const rate = await checkRateLimit(`spaceship-dns-write:${auth.user.id}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const payload = spaceshipDnsWriteSchema.parse(body);
    const data = await updateSpaceshipDns(payload.domain, payload.records);
    await writeAuditLog({
      userId: auth.user.id,
      action: "spaceship_dns_write",
      provider: "spaceship",
      target: payload.domain,
      payloadSummary: { records: payload.records.length },
      result: "success",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update Spaceship DNS records";
    logError({ route: "/api/providers/spaceship/dns", requestId: meta.requestId }, error, "spaceship dns write failed");
    await writeAuditLog({
      userId: auth.user.id,
      action: "spaceship_dns_write",
      provider: "spaceship",
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
    return errorResponse("Failed to update Spaceship DNS records", 400);
  }
}


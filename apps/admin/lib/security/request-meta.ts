import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export type RequestAuditMeta = {
  ip: string;
  userAgent: string;
  requestId: string;
};

export function getRequestAuditMeta(request: NextRequest): RequestAuditMeta {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  return {
    ip,
    userAgent,
    requestId
  };
}

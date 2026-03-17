import { randomUUID } from "crypto";
import { getDb, auditLogs } from "@/packages/db";

export async function writeAuditLog(params: {
  userId: number;
  action: string;
  provider: string;
  target: string;
  payloadSummary?: Record<string, unknown>;
  result: "success" | "fail";
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  errorMessage?: string;
  durationMs?: number;
  requestId?: string;
}) {
  const db = getDb();
  await db.insert(auditLogs).values({
    user_id: params.userId,
    action: params.action,
    provider: params.provider,
    target: params.target,
    payload_summary: params.payloadSummary ?? {},
    result: params.result,
    ip: params.ip ?? "unknown",
    user_agent: params.userAgent ?? "unknown",
    status_code: params.statusCode ?? 0,
    error_message: params.errorMessage ?? null,
    duration_ms: params.durationMs ?? 0,
    request_id: params.requestId ?? randomUUID()
  });
}

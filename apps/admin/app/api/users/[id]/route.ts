import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";
import { logError } from "@/lib/security/logger";
import { requireApiUser } from "@/lib/security/auth";
import { roleSchema } from "@/lib/security/roles";
import { writeAuditLog } from "@/lib/security/audit";
import {
  resetUserPassword,
  updateMustChangePassword,
  updateUserRole,
  updateUserStatus,
  type UserRecordWithTemporaryPassword,
  UserServiceError
} from "@/lib/services/users";

const updateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("role"),
    role: roleSchema
  }),
  z.object({
    type: z.literal("status"),
    isActive: z.boolean()
  }),
  z.object({
    type: z.literal("must_change_password"),
    mustChangePassword: z.boolean()
  }),
  z.object({
    type: z.literal("reset_password"),
    password: z.string().min(10).optional().or(z.literal(""))
  })
]);

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  const auth = await requireApiUser("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const meta = getRequestAuditMeta(request);
  const startedAt = Date.now();

  try {
    const params = paramsSchema.parse(context.params);
    const payload = updateSchema.parse(await request.json());

    const data = payload.type === "role"
      ? await updateUserRole(auth.user, params.id, payload.role)
      : payload.type === "status"
        ? await updateUserStatus(auth.user, params.id, payload.isActive)
        : payload.type === "must_change_password"
          ? await updateMustChangePassword(auth.user, params.id, payload.mustChangePassword)
          : await resetUserPassword({
            actor: auth.user,
            targetUserId: params.id,
            password: payload.password
          });

    await writeAuditLog({
      userId: auth.user.id,
      action:
        payload.type === "role"
          ? "update_user_role"
          : payload.type === "status"
            ? "update_user_status"
            : payload.type === "must_change_password"
              ? "update_user_password_flag"
              : "reset_user_password",
      provider: "users",
      target: String(params.id),
      payloadSummary:
        payload.type === "role"
          ? { role: payload.role }
          : payload.type === "status"
            ? { isActive: payload.isActive }
            : payload.type === "must_change_password"
              ? { mustChangePassword: payload.mustChangePassword }
              : { temporaryPasswordIssued: true },
      result: "success",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    return NextResponse.json({
      data: payload.type === "reset_password"
        ? {
          ...(data as UserRecordWithTemporaryPassword),
          temporaryPassword: (data as UserRecordWithTemporaryPassword).temporaryPassword
        }
        : data
    });
  } catch (error) {
    const statusCode = error instanceof UserServiceError ? error.statusCode : 400;
    const message = error instanceof UserServiceError ? error.message : "No fue posible actualizar el usuario";

    await writeAuditLog({
      userId: auth.user.id,
      action: "update_user",
      provider: "users",
      target: context.params.id,
      payloadSummary: {},
      result: "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode,
      errorMessage: error instanceof Error ? error.message : "unknown",
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    logError({ route: `/api/users/${context.params.id}`, requestId: meta.requestId }, error, "failed to update user");
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

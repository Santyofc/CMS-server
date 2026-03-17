import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginWithEmailPassword, requireApiUser } from "@/lib/security/auth";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";
import { writeAuditLog } from "@/lib/security/audit";
import { logError } from "@/lib/security/logger";
import { changeOwnPassword, UserServiceError } from "@/lib/services/users";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(10),
  nextPassword: z.string().min(10)
});

export async function POST(request: NextRequest) {
  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  const auth = await requireApiUser("viewer", { allowPasswordChange: true });
  if (!auth.ok) {
    return auth.response;
  }

  const meta = getRequestAuditMeta(request);
  const startedAt = Date.now();

  try {
    const payload = changePasswordSchema.parse(await request.json());
    await changeOwnPassword(auth.user.id, payload.currentPassword, payload.nextPassword);
    const refreshedUser = await loginWithEmailPassword(auth.user.email, payload.nextPassword);

    await writeAuditLog({
      userId: auth.user.id,
      action: "change_own_password",
      provider: "users",
      target: auth.user.email,
      payloadSummary: {
        mustChangePassword: false
      },
      result: "success",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 200,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    return NextResponse.json({
      data: {
        user: refreshedUser
      }
    });
  } catch (error) {
    const statusCode = error instanceof UserServiceError ? error.statusCode : 400;
    const message = error instanceof UserServiceError ? error.message : "No fue posible actualizar la contraseña";

    await writeAuditLog({
      userId: auth.user.id,
      action: "change_own_password",
      provider: "users",
      target: auth.user.email,
      payloadSummary: {},
      result: "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode,
      errorMessage: error instanceof Error ? error.message : "unknown",
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    logError({ route: "/api/account/password", requestId: meta.requestId }, error, "failed to change own password");
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

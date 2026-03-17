import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";
import { logError } from "@/lib/security/logger";
import { requireApiUser } from "@/lib/security/auth";
import { roleSchema } from "@/lib/security/roles";
import { writeAuditLog } from "@/lib/security/audit";
import { createUser, listUsers, UserServiceError } from "@/lib/services/users";

const listQuerySchema = z.object({
  role: z.union([roleSchema, z.literal("all")]).optional(),
  status: z.enum(["all", "active", "inactive"]).optional()
});

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres").optional().or(z.literal("")),
  role: roleSchema,
  mustChangePassword: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser("admin");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const query = listQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const data = await listUsers({
      role: query.role ?? "all",
      status: query.status ?? "all"
    });

    return NextResponse.json({ data });
  } catch (error) {
    logError({ route: "/api/users" }, error, "failed to load users");
    return NextResponse.json({ error: "No fue posible cargar los usuarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const payload = createUserSchema.parse(body);
    const created = await createUser(auth.user, payload);

    await writeAuditLog({
      userId: auth.user.id,
      action: "create_user",
      provider: "users",
      target: created.email,
      payloadSummary: {
        role: created.role,
        isActive: created.isActive,
        mustChangePassword: created.mustChangePassword
      },
      result: "success",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode: 201,
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    return NextResponse.json({
      data: {
        ...created,
        temporaryPassword: created.temporaryPassword
      }
    }, { status: 201 });
  } catch (error) {
    const statusCode = error instanceof UserServiceError ? error.statusCode : 400;
    const message = error instanceof UserServiceError ? error.message : "No fue posible crear el usuario";

    await writeAuditLog({
      userId: auth.user.id,
      action: "create_user",
      provider: "users",
      target: "pending",
      payloadSummary: {},
      result: "fail",
      ip: meta.ip,
      userAgent: meta.userAgent,
      statusCode,
      errorMessage: error instanceof Error ? error.message : "unknown",
      durationMs: Date.now() - startedAt,
      requestId: meta.requestId
    });

    logError({ route: "/api/users", requestId: meta.requestId }, error, "failed to create user");
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

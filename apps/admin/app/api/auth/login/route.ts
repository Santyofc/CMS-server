import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { loginWithEmailPassword } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { enforceSameOrigin } from "@/lib/security/request-integrity";
import { getRequestAuditMeta } from "@/lib/security/request-meta";
import { logError } from "@/lib/security/logger";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  const meta = getRequestAuditMeta(request);
  const ip = meta.ip;
  const rate = await checkRateLimit(`login:${ip}`, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const payload = loginSchema.parse(body);

    const user = await loginWithEmailPassword(payload.email, payload.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ data: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    logError({ route: "/api/auth/login" }, error, "login failed");
    return NextResponse.json({ error: "Login failed" }, { status: 400 });
  }
}



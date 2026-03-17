import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { loginWithEmailPassword } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(`login:${ip}`, 10, 60_000);
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
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { logoutCurrentSession } from "@/lib/security/auth";
import { enforceSameOrigin } from "@/lib/security/request-integrity";

export async function POST(request: NextRequest) {
  const sameOrigin = enforceSameOrigin(request);
  if (!sameOrigin.ok) {
    return sameOrigin.response;
  }

  await logoutCurrentSession();
  return NextResponse.json({ data: { ok: true } });
}

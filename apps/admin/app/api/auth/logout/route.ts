import { NextResponse } from "next/server";
import { logoutCurrentSession } from "@/lib/security/auth";

export async function POST() {
  await logoutCurrentSession();
  return NextResponse.json({ data: { ok: true } });
}

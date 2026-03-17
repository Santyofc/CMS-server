import { NextResponse } from "next/server";
import { logInfo } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  logInfo({ route: "/api/health" }, "health probe");

  return NextResponse.json({
    status: "ok",
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
}

import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/packages/db";
import { errorResponse } from "@/lib/security/http";
import { logError, logInfo } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    logInfo({ route: "/api/readiness" }, "readiness probe");

    return NextResponse.json({
      status: "ready",
      checks: {
        database: "ok"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError({ route: "/api/readiness" }, error, "readiness probe failed");
    return errorResponse("Service unavailable", 503);
  }
}

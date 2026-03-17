import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/packages/db";
import { logError, logInfo } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    logInfo({ route: "/api/readiness", check: "database", status: "ok" }, "readiness probe passed");

    return NextResponse.json({
      status: "ready",
      checks: {
        database: "ok"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError({ route: "/api/readiness", check: "database", status: "error" }, error, "database readiness probe failed");
    return NextResponse.json({
      status: "not_ready",
      checks: {
        database: "error"
      },
      error: "Database unavailable",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

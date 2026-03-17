import { desc } from "drizzle-orm";
import { deploymentRuns, getDb } from "@/packages/db";
import { requireDatabaseEnv } from "@/lib/config/env";

export async function listDeploymentRuns(limit = 50) {
  requireDatabaseEnv();
  const db = getDb();
  return db.select().from(deploymentRuns).orderBy(desc(deploymentRuns.created_at)).limit(limit);
}

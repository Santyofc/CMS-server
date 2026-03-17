import { desc, sql } from "drizzle-orm";
import {
  deploymentRuns,
  ec2Metrics,
  getDb,
  providers,
  repositories,
  servers,
  spaceshipDnsRecords,
  spaceshipDomains,
  syncRuns,
  vercelProjects,
  neonProjects
} from "@/packages/db";
import { requireDatabaseEnv } from "@/lib/config/env";
import type { DashboardSummaryDto } from "@/lib/dto/platform";

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    return Number(value);
  }
  return 0;
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  requireDatabaseEnv();
  const db = getDb();

  const [repoCount] = await db.select({ count: sql<number>`count(*)` }).from(repositories);
  const [instanceCount] = await db.select({ count: sql<number>`count(*)` }).from(servers);
  const [vercelCount] = await db.select({ count: sql<number>`count(*)` }).from(vercelProjects);
  const [neonCount] = await db.select({ count: sql<number>`count(*)` }).from(neonProjects);
  const [domainCount] = await db.select({ count: sql<number>`count(*)` }).from(spaceshipDomains);
  const [dnsCount] = await db.select({ count: sql<number>`count(*)` }).from(spaceshipDnsRecords);

  const metrics = await db.select().from(ec2Metrics).orderBy(desc(ec2Metrics.timestamp)).limit(120);
  const timeline = await db.select().from(syncRuns).orderBy(desc(syncRuns.started_at)).limit(25);
  const providerRows = await db.select().from(providers).orderBy(providers.name);
  const deployments = await db.select().from(deploymentRuns).orderBy(desc(deploymentRuns.created_at)).limit(8);

  return {
    totals: {
      repositories: toNumber(repoCount?.count),
      instances: toNumber(instanceCount?.count),
      vercel_projects: toNumber(vercelCount?.count),
      neon_projects: toNumber(neonCount?.count),
      domains: toNumber(domainCount?.count),
      dns_records: toNumber(dnsCount?.count)
    },
    cloudwatch: metrics.map((point) => ({
      metric: point.metric_name,
      timestamp: point.timestamp.toISOString(),
      value: point.value,
      unit: point.unit
    })),
    timeline: timeline.map((run) => ({
      provider: run.provider,
      action: run.action,
      status: run.status,
      finished_at: run.finished_at ? run.finished_at.toISOString() : null,
      records_total: run.records_total
    })),
    providers: providerRows.map((provider) => ({
      key: provider.key,
      name: provider.name,
      mode: provider.mode,
      last_synced_at: provider.last_synced_at ? provider.last_synced_at.toISOString() : null
    })),
    deployments: deployments.map((deployment) => ({
      provider: deployment.provider,
      project_name: deployment.project_name,
      status: deployment.status,
      url: deployment.url ?? null,
      created_at: deployment.created_at.toISOString()
    }))
  };
}

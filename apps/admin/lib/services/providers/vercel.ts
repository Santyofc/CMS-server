import { desc } from "drizzle-orm";
import { createVercelProvider } from "@/packages/vercel";
import { deploymentRuns, getDb, vercelDeployments, vercelProjects } from "@/packages/db";
import {
  assertVercelRedeployAllowed,
  requireDatabaseEnv,
  requireVercelEnv
} from "@/lib/config/env";
import type { VercelProjectDto } from "@/lib/dto/platform";
import { completeSyncRun, createSyncRun, ensureProvider } from "@/lib/services/sync-runs";

export async function syncVercel() {
  requireDatabaseEnv();
  requireVercelEnv();
  await ensureProvider("vercel", "active");

  const provider = createVercelProvider();
  const db = getDb();
  const syncRunId = await createSyncRun("vercel", "sync_projects_deployments");

  try {
    const [projects, deployments] = await Promise.all([
      provider.listProjects(),
      provider.listDeployments(30)
    ]);

    let upserted = 0;

    for (const project of projects) {
      await db.insert(vercelProjects).values({
        project_id: project.id,
        name: project.name,
        framework: project.framework,
        latest_deployment_state: project.latest_deployment_state,
        updated_at: project.updated_at ? new Date(project.updated_at) : null,
        synced_at: new Date(),
        raw: project
      }).onConflictDoUpdate({
        target: vercelProjects.project_id,
        set: {
          name: project.name,
          framework: project.framework,
          latest_deployment_state: project.latest_deployment_state,
          updated_at: project.updated_at ? new Date(project.updated_at) : null,
          synced_at: new Date(),
          raw: project
        }
      });

      upserted += 1;
    }

    for (const deployment of deployments) {
      await db.insert(vercelDeployments).values({
        deployment_id: deployment.id,
        project_id: deployment.project_id,
        project_name: deployment.project_name,
        state: deployment.state,
        url: deployment.url,
        created_at: new Date(deployment.created_at),
        synced_at: new Date(),
        raw: deployment
      }).onConflictDoUpdate({
        target: vercelDeployments.deployment_id,
        set: {
          project_id: deployment.project_id,
          project_name: deployment.project_name,
          state: deployment.state,
          url: deployment.url,
          created_at: new Date(deployment.created_at),
          synced_at: new Date(),
          raw: deployment
        }
      });

      await db.insert(deploymentRuns).values({
        provider: "vercel",
        external_id: deployment.id,
        project_name: deployment.project_name,
        status: deployment.state,
        url: deployment.url,
        created_at: new Date(deployment.created_at),
        metadata: deployment
      }).onConflictDoUpdate({
        target: [deploymentRuns.provider, deploymentRuns.external_id],
        set: {
          project_name: deployment.project_name,
          status: deployment.state,
          url: deployment.url,
          metadata: deployment
        }
      });
    }

    return completeSyncRun({
      id: syncRunId,
      provider: "vercel",
      status: "success",
      recordsTotal: projects.length + deployments.length,
      recordsUpserted: upserted + deployments.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel sync failed";
    return completeSyncRun({
      id: syncRunId,
      provider: "vercel",
      status: "failed",
      recordsTotal: 0,
      recordsUpserted: 0,
      errorMessage: message
    });
  }
}

export async function listVercelProjects(): Promise<VercelProjectDto[]> {
  requireDatabaseEnv();
  const db = getDb();
  const rows = await db.select().from(vercelProjects).orderBy(desc(vercelProjects.synced_at));

  return rows.map((row) => {
    const raw = row.raw as { domains?: string[] };

    return {
      project_id: row.project_id,
      name: row.name,
      framework: row.framework,
      latest_deployment_state: row.latest_deployment_state,
      updated_at: row.updated_at ? row.updated_at.toISOString() : null,
      domains: raw.domains ?? []
    };
  });
}

export async function listVercelDeployments(limit = 30) {
  requireDatabaseEnv();
  const db = getDb();
  return db.select().from(vercelDeployments).orderBy(desc(vercelDeployments.created_at)).limit(limit);
}

export async function redeployVercelDeployment(deploymentId: string) {
  requireVercelEnv();
  assertVercelRedeployAllowed(deploymentId);
  const provider = createVercelProvider();
  return provider.redeploy(deploymentId);
}

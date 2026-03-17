import { desc, eq } from "drizzle-orm";
import { createNeonProvider } from "@/packages/neon";
import { getDb, neonBranches, neonDatabases, neonProjects } from "@/packages/db";
import { requireDatabaseEnv, requireNeonEnv } from "@/lib/config/env";
import type { NeonProjectDto } from "@/lib/dto/platform";
import { completeSyncRun, createSyncRun, ensureProvider } from "@/lib/services/sync-runs";

export async function syncNeon() {
  requireDatabaseEnv();
  requireNeonEnv();
  await ensureProvider("neon", "active");

  const provider = createNeonProvider();
  const db = getDb();
  const syncRunId = await createSyncRun("neon", "sync_projects");

  try {
    const projects = await provider.listProjects();
    let upserted = 0;

    for (const project of projects) {
      await db.insert(neonProjects).values({
        project_id: project.id,
        name: project.name,
        region_id: project.region_id,
        platform_id: project.platform_id,
        created_at_remote: new Date(project.created_at),
        updated_at_remote: new Date(project.updated_at),
        synced_at: new Date(),
        raw: project
      }).onConflictDoUpdate({
        target: neonProjects.project_id,
        set: {
          name: project.name,
          region_id: project.region_id,
          platform_id: project.platform_id,
          created_at_remote: new Date(project.created_at),
          updated_at_remote: new Date(project.updated_at),
          synced_at: new Date(),
          raw: project
        }
      });

      const [branches, endpoints] = await Promise.all([
        provider.listBranches(project.id),
        provider.listEndpoints(project.id)
      ]);

      for (const branch of branches) {
        await db.insert(neonBranches).values({
          branch_id: branch.id,
          project_id: branch.project_id,
          name: branch.name,
          primary: branch.primary,
          is_default: branch.is_default,
          synced_at: new Date(),
          raw: branch
        }).onConflictDoUpdate({
          target: neonBranches.branch_id,
          set: {
            project_id: branch.project_id,
            name: branch.name,
            primary: branch.primary,
            is_default: branch.is_default,
            synced_at: new Date(),
            raw: branch
          }
        });

        const databases = await provider.listDatabases(project.id, branch.id);

        for (const database of databases) {
          await db.insert(neonDatabases).values({
            database_id: String(database.id),
            project_id: database.project_id,
            branch_id: database.branch_id,
            name: database.name,
            owner_name: database.owner_name,
            synced_at: new Date(),
            raw: database
          }).onConflictDoUpdate({
            target: neonDatabases.database_id,
            set: {
              project_id: database.project_id,
              branch_id: database.branch_id,
              name: database.name,
              owner_name: database.owner_name,
              synced_at: new Date(),
              raw: database
            }
          });
        }
      }

      await db.update(neonProjects).set({
        raw: { ...project, endpoints }
      }).where(eq(neonProjects.project_id, project.id));

      upserted += 1;
    }

    return completeSyncRun({
      id: syncRunId,
      provider: "neon",
      status: "success",
      recordsTotal: projects.length,
      recordsUpserted: upserted
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Neon sync failed";
    return completeSyncRun({
      id: syncRunId,
      provider: "neon",
      status: "failed",
      recordsTotal: 0,
      recordsUpserted: 0,
      errorMessage: message
    });
  }
}

export async function listNeonProjects(): Promise<NeonProjectDto[]> {
  requireDatabaseEnv();
  const db = getDb();
  const projects = await db.select().from(neonProjects).orderBy(desc(neonProjects.synced_at));
  const branches = await db.select().from(neonBranches);
  const databases = await db.select().from(neonDatabases);

  return projects.map((project) => {
    const projectBranches = branches.filter((branch) => branch.project_id === project.project_id);
    const projectDatabases = databases.filter((database) => database.project_id === project.project_id);
    const raw = project.raw as { endpoints?: Array<{ id: string; branch_id: string; type: string; current_state: string }> };

    return {
      project_id: project.project_id,
      name: project.name,
      region_id: project.region_id,
      platform_id: project.platform_id,
      branches: projectBranches.map((branch) => ({
        id: branch.branch_id,
        name: branch.name,
        primary: branch.primary,
        is_default: branch.is_default
      })),
      databases: projectDatabases.map((database) => ({
        id: database.database_id,
        branch_id: database.branch_id,
        name: database.name,
        owner_name: database.owner_name
      })),
      compute: raw.endpoints ?? []
    };
  });
}

export async function createNeonBranch(projectId: string, branchName: string) {
  requireNeonEnv();
  const provider = createNeonProvider();
  return provider.createBranch(projectId, branchName);
}

export async function listNeonBranches(projectId: string) {
  requireNeonEnv();
  const provider = createNeonProvider();
  return provider.listBranches(projectId);
}

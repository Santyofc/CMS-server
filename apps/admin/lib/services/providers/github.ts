import { desc, eq } from "drizzle-orm";
import { createGithubProvider } from "@/packages/github";
import { getDb, repositories, repositoryBranches } from "@/packages/db";
import { requireDatabaseEnv, requireGithubEnv } from "@/lib/config/env";
import type { GithubRepoDto } from "@/lib/dto/platform";
import { completeSyncRun, createSyncRun, ensureProvider } from "@/lib/services/sync-runs";

function toRepoDto(
  repo: typeof repositories.$inferSelect,
  branches: Array<typeof repositoryBranches.$inferSelect>
): GithubRepoDto {
  const raw = repo.raw as { open_prs?: number };

  return {
    full_name: repo.full_name,
    name: repo.name,
    visibility: repo.visibility,
    private: repo.private,
    default_branch: repo.default_branch,
    html_url: repo.html_url,
    updated_at: repo.updated_at.toISOString(),
    branches: branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      latest_commit_sha: branch.latest_commit_sha
    })),
    latest_commit: branches[0]?.latest_commit_sha
      ? {
          sha: branches[0].latest_commit_sha,
          message: branches[0].latest_commit_message ?? "",
          author_date: branches[0].latest_commit_date?.toISOString() ?? new Date().toISOString(),
          html_url: repo.html_url
        }
      : null,
    open_prs: typeof raw.open_prs === "number" ? raw.open_prs : 0
  };
}

export async function syncGithubRepos() {
  requireDatabaseEnv();
  requireGithubEnv();
  await ensureProvider("github", "active");

  const provider = createGithubProvider();
  const db = getDb();
  const syncRunId = await createSyncRun("github", "sync_repositories");

  try {
    const remoteRepos = await provider.listRepositories();
    let upserted = 0;

    for (const repo of remoteRepos) {
      await db.insert(repositories).values({
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        visibility: repo.visibility,
        default_branch: repo.default_branch,
        html_url: repo.html_url,
        updated_at: new Date(repo.updated_at),
        synced_at: new Date(),
        raw: repo
      }).onConflictDoUpdate({
        target: repositories.full_name,
        set: {
          name: repo.name,
          private: repo.private,
          visibility: repo.visibility,
          default_branch: repo.default_branch,
          html_url: repo.html_url,
          updated_at: new Date(repo.updated_at),
          synced_at: new Date(),
          raw: repo
        }
      });

      for (const branch of repo.branches) {
        await db.insert(repositoryBranches).values({
          repository_full_name: repo.full_name,
          name: branch.name,
          protected: branch.protected,
          latest_commit_sha: branch.latest_commit_sha,
          latest_commit_message: repo.latest_commit?.message,
          latest_commit_date: repo.latest_commit?.author_date ? new Date(repo.latest_commit.author_date) : null,
          synced_at: new Date()
        }).onConflictDoUpdate({
          target: [repositoryBranches.repository_full_name, repositoryBranches.name],
          set: {
            protected: branch.protected,
            latest_commit_sha: branch.latest_commit_sha,
            latest_commit_message: repo.latest_commit?.message,
            latest_commit_date: repo.latest_commit?.author_date ? new Date(repo.latest_commit.author_date) : null,
            synced_at: new Date()
          }
        });
      }

      upserted += 1;
    }

    const run = await completeSyncRun({
      id: syncRunId,
      provider: "github",
      status: "success",
      recordsTotal: remoteRepos.length,
      recordsUpserted: upserted,
      metadata: { source: "repos" }
    });

    return run;
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub sync failed";
    return completeSyncRun({
      id: syncRunId,
      provider: "github",
      status: "failed",
      recordsTotal: 0,
      recordsUpserted: 0,
      errorMessage: message
    });
  }
}

export async function listGithubRepos(): Promise<GithubRepoDto[]> {
  requireDatabaseEnv();
  const db = getDb();
  const repos = await db.select().from(repositories).orderBy(desc(repositories.updated_at));
  const branches = await db.select().from(repositoryBranches);

  return repos.map((repo) => {
    const repoBranches = branches
      .filter((branch) => branch.repository_full_name === repo.full_name)
      .sort((a, b) => b.synced_at.getTime() - a.synced_at.getTime());

    return toRepoDto(repo, repoBranches);
  });
}

export async function getGithubRepo(fullName: string): Promise<GithubRepoDto | null> {
  requireDatabaseEnv();
  const db = getDb();
  const [repo] = await db.select().from(repositories).where(eq(repositories.full_name, fullName));
  if (!repo) {
    return null;
  }

  const branches = await db.select().from(repositoryBranches).where(eq(repositoryBranches.repository_full_name, fullName));
  return toRepoDto(repo, branches);
}

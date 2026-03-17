import { eq } from "drizzle-orm";
import { getDb, providers, syncRuns } from "@/packages/db";

type ProviderKey = "aws" | "github" | "vercel" | "neon" | "spaceship" | "spacemail";

type Status = "running" | "success" | "failed";

const providerNames: Record<ProviderKey, string> = {
  aws: "AWS",
  github: "GitHub",
  vercel: "Vercel",
  neon: "Neon",
  spaceship: "Spaceship DNS",
  spacemail: "SpaceMail"
};

export async function ensureProvider(provider: ProviderKey, mode: "active" | "read-only" | "pending" = "active") {
  const db = getDb();

  await db.insert(providers).values({
    key: provider,
    name: providerNames[provider],
    mode
  }).onConflictDoUpdate({
    target: providers.key,
    set: {
      mode,
      name: providerNames[provider]
    }
  });
}

export async function createSyncRun(provider: ProviderKey, action = "sync", metadata: Record<string, unknown> = {}) {
  const db = getDb();
  const [run] = await db.insert(syncRuns).values({
    provider,
    action,
    status: "running",
    metadata,
    started_at: new Date()
  }).returning({ id: syncRuns.id });

  return run.id;
}

export async function completeSyncRun(params: {
  id: number;
  provider: ProviderKey;
  status: Exclude<Status, "running">;
  recordsTotal: number;
  recordsUpserted: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const now = new Date();

  const [run] = await db.update(syncRuns).set({
    status: params.status,
    records_total: params.recordsTotal,
    records_upserted: params.recordsUpserted,
    error_message: params.errorMessage,
    metadata: params.metadata ?? {},
    finished_at: now
  }).where(eq(syncRuns.id, params.id)).returning({
    id: syncRuns.id,
    status: syncRuns.status,
    records_total: syncRuns.records_total,
    records_upserted: syncRuns.records_upserted,
    finished_at: syncRuns.finished_at
  });

  await db.update(providers).set({ last_synced_at: now }).where(eq(providers.key, params.provider));

  return run;
}

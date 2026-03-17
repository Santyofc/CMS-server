import { desc, inArray } from "drizzle-orm";
import { createSpaceshipProvider } from "@/packages/spaceship";
import { getDb, servers, spaceshipDnsRecords, spaceshipDomains } from "@/packages/db";
import {
  assertSpaceshipDnsWriteAllowed,
  requireDatabaseEnv,
  requireSpaceshipEnv
} from "@/lib/config/env";
import type { SpaceshipDnsDto } from "@/lib/dto/platform";
import { completeSyncRun, createSyncRun, ensureProvider } from "@/lib/services/sync-runs";

export async function syncSpaceshipDns() {
  requireDatabaseEnv();
  requireSpaceshipEnv();
  await ensureProvider("spaceship", "active");

  const provider = createSpaceshipProvider();
  const db = getDb();
  const syncRunId = await createSyncRun("spaceship", "sync_dns");

  try {
    const domains = await provider.listDomains();
    let upserted = 0;

    for (const domain of domains) {
      await db.insert(spaceshipDomains).values({
        domain: domain.name,
        unicode_name: domain.unicode_name,
        lifecycle_status: domain.lifecycle_status,
        expiration_date: domain.expiration_date ? new Date(domain.expiration_date) : null,
        synced_at: new Date(),
        raw: domain
      }).onConflictDoUpdate({
        target: spaceshipDomains.domain,
        set: {
          unicode_name: domain.unicode_name,
          lifecycle_status: domain.lifecycle_status,
          expiration_date: domain.expiration_date ? new Date(domain.expiration_date) : null,
          synced_at: new Date(),
          raw: domain
        }
      });

      const records = await provider.listDnsRecords(domain.name);
      for (const record of records) {
        if (!["A", "CNAME", "TXT", "MX"].includes(record.type)) {
          continue;
        }

        await db.insert(spaceshipDnsRecords).values({
          domain: record.domain,
          type: record.type,
          name: record.name,
          value: record.value,
          ttl: record.ttl,
          synced_at: new Date(),
          raw: record
        }).onConflictDoUpdate({
          target: [spaceshipDnsRecords.domain, spaceshipDnsRecords.type, spaceshipDnsRecords.name, spaceshipDnsRecords.value],
          set: {
            ttl: record.ttl,
            synced_at: new Date(),
            raw: record
          }
        });

        upserted += 1;
      }
    }

    return completeSyncRun({
      id: syncRunId,
      provider: "spaceship",
      status: "success",
      recordsTotal: upserted,
      recordsUpserted: upserted
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Spaceship sync failed";
    return completeSyncRun({
      id: syncRunId,
      provider: "spaceship",
      status: "failed",
      recordsTotal: 0,
      recordsUpserted: 0,
      errorMessage: message
    });
  }
}

export async function listSpaceshipDns(domain?: string): Promise<SpaceshipDnsDto[]> {
  requireDatabaseEnv();
  const db = getDb();
  const domains = await db.select().from(spaceshipDomains).orderBy(desc(spaceshipDomains.synced_at));

  const domainList = domain
    ? domains.filter((item) => item.domain === domain)
    : domains;

  if (domainList.length === 0) {
    return [];
  }

  const records = await db.select().from(spaceshipDnsRecords)
    .where(inArray(spaceshipDnsRecords.domain, domainList.map((item) => item.domain)));
  const infraServers = await db.select().from(servers);
  const publicIps = new Set(infraServers.map((server) => server.public_ip).filter((ip): ip is string => Boolean(ip)));

  return domainList.map((item) => ({
    domain: item.domain,
    drift_detected: records
      .filter((record) => record.domain === item.domain && record.type === "A")
      .some((record) => !publicIps.has(record.value)),
    drift_notes: records
      .filter((record) => record.domain === item.domain && record.type === "A")
      .filter((record) => !publicIps.has(record.value))
      .map((record) => `A record ${record.name} -> ${record.value} no coincide con IPs EC2 conocidas`),
    records: records
      .filter((record) => record.domain === item.domain)
      .map((record) => ({
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: record.ttl
      }))
  }));
}

export async function updateSpaceshipDns(domain: string, records: Array<{ domain: string; type: "A" | "CNAME" | "TXT" | "MX"; name: string; value: string; ttl: number }>) {
  requireSpaceshipEnv();
  assertSpaceshipDnsWriteAllowed(domain);
  const provider = createSpaceshipProvider();
  await provider.saveDnsRecords(domain, records);

  return {
    domain,
    updated_records: records.length
  };
}

export async function getSpaceMailStatus() {
  return {
    provider: "spacemail",
    mode: "pending",
    reason: "No public SpaceMail mailbox API documented in Spaceship official docs.",
    available_actions: [] as string[]
  };
}

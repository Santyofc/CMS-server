import { and, desc, eq, gte } from "drizzle-orm";
import { createAwsProvider } from "@/packages/aws";
import { ec2Metrics, getDb, servers } from "@/packages/db";
import {
  assertAwsWriteAllowed,
  requireAwsEnv,
  requireDatabaseEnv
} from "@/lib/config/env";
import type { AwsInstanceDto, MetricPointDto } from "@/lib/dto/platform";
import { completeSyncRun, createSyncRun, ensureProvider } from "@/lib/services/sync-runs";

function toInstanceDto(row: typeof servers.$inferSelect): AwsInstanceDto {
  return {
    instance_id: row.instance_id,
    state: row.state,
    public_ip: row.public_ip,
    private_ip: row.private_ip,
    name: row.name,
    region: row.region,
    instance_type: row.instance_type,
    availability_zone: row.availability_zone,
    launch_time: row.launch_time ? row.launch_time.toISOString() : null,
    health: {
      system_status: row.health_system_status,
      instance_status: row.health_instance_status
    },
    tags: row.tags
  };
}

export async function listAwsInstances(): Promise<AwsInstanceDto[]> {
  requireDatabaseEnv();
  const db = getDb();
  const rows = await db.select().from(servers).orderBy(desc(servers.synced_at));
  return rows.map(toInstanceDto);
}

export async function syncAwsEc2() {
  requireDatabaseEnv();
  requireAwsEnv();
  await ensureProvider("aws", "active");

  const provider = createAwsProvider();
  const db = getDb();
  const syncRunId = await createSyncRun("aws", "sync_ec2");

  try {
    const instances = await provider.listEc2Instances();
    let upserted = 0;

    for (const instance of instances) {
      await db.insert(servers).values({
        instance_id: instance.instance_id,
        state: instance.state,
        public_ip: instance.public_ip,
        private_ip: instance.private_ip,
        name: instance.name,
        region: instance.region,
        instance_type: instance.instance_type,
        availability_zone: instance.availability_zone,
        launch_time: instance.launch_time ? new Date(instance.launch_time) : null,
        health_system_status: instance.health.system_status,
        health_instance_status: instance.health.instance_status,
        tags: instance.tags,
        synced_at: new Date(),
        raw: instance
      }).onConflictDoUpdate({
        target: servers.instance_id,
        set: {
          state: instance.state,
          public_ip: instance.public_ip,
          private_ip: instance.private_ip,
          name: instance.name,
          region: instance.region,
          instance_type: instance.instance_type,
          availability_zone: instance.availability_zone,
          launch_time: instance.launch_time ? new Date(instance.launch_time) : null,
          health_system_status: instance.health.system_status,
          health_instance_status: instance.health.instance_status,
          tags: instance.tags,
          synced_at: new Date(),
          raw: instance
        }
      });

      upserted += 1;
    }

    const run = await completeSyncRun({
      id: syncRunId,
      provider: "aws",
      status: "success",
      recordsTotal: instances.length,
      recordsUpserted: upserted,
      metadata: { source: "ec2" }
    });

    return run;
  } catch (error) {
    const message = error instanceof Error ? error.message : "AWS sync failed";
    return completeSyncRun({
      id: syncRunId,
      provider: "aws",
      status: "failed",
      recordsTotal: 0,
      recordsUpserted: 0,
      errorMessage: message,
      metadata: { source: "ec2" }
    });
  }
}

export async function getAwsMetrics(instanceId: string, hours = 24): Promise<MetricPointDto[]> {
  requireDatabaseEnv();
  requireAwsEnv();
  const provider = createAwsProvider();
  const db = getDb();
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  const endTime = new Date();

  const points = await provider.getEc2Metrics({
    instanceId,
    startTime,
    endTime,
    periodSeconds: 300
  });

  for (const point of points) {
    await db.insert(ec2Metrics).values({
      instance_id: instanceId,
      metric_name: point.metric,
      timestamp: new Date(point.timestamp),
      value: point.value,
      unit: point.unit
    }).onConflictDoUpdate({
      target: [ec2Metrics.instance_id, ec2Metrics.metric_name, ec2Metrics.timestamp],
      set: {
        value: point.value,
        unit: point.unit
      }
    });
  }

  const cached = await db.select().from(ec2Metrics)
    .where(and(eq(ec2Metrics.instance_id, instanceId), gte(ec2Metrics.timestamp, startTime)))
    .orderBy(desc(ec2Metrics.timestamp));

  return cached.map((point) => ({
    metric: point.metric_name,
    timestamp: point.timestamp.toISOString(),
    value: point.value,
    unit: point.unit
  }));
}

export async function runAwsInstanceAction(action: "start" | "stop" | "reboot" | "health_check", instanceId: string) {
  requireAwsEnv();
  await ensureProvider("aws", "active");
  const provider = createAwsProvider();

  if (action === "health_check") {
    return provider.getInstanceHealth(instanceId);
  }

  assertAwsWriteAllowed(instanceId);

  if (action === "start") {
    await provider.startInstance(instanceId);
  }

  if (action === "stop") {
    await provider.stopInstance(instanceId);
  }

  if (action === "reboot") {
    await provider.rebootInstance(instanceId);
  }

  return { instance_id: instanceId, action, status: "requested" };
}

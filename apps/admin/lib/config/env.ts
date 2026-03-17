import { z } from "zod";

const baseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required")
});

const awsEnvSchema = z.object({
  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required")
});

const githubEnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required")
});

const vercelEnvSchema = z.object({
  VERCEL_TOKEN: z.string().min(1, "VERCEL_TOKEN is required")
});

const neonEnvSchema = z.object({
  NEON_API_KEY: z.string().min(1, "NEON_API_KEY is required")
});

const spaceshipEnvSchema = z.object({
  SPACESHIP_API_KEY: z.string().min(1, "SPACESHIP_API_KEY is required"),
  SPACESHIP_API_SECRET: z.string().min(1, "SPACESHIP_API_SECRET is required")
});

export const awsActionSchema = z.object({
  action: z.enum(["start", "stop", "reboot", "health_check"]),
  instance_id: z.string().min(1)
});

export const awsMetricsQuerySchema = z.object({
  instance_id: z.string().min(1),
  hours: z.coerce.number().int().min(1).max(168).default(24)
});

export const vercelRedeploySchema = z.object({
  action: z.literal("redeploy"),
  deployment_id: z.string().min(1)
});

export const neonActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_branch"),
    project_id: z.string().min(1),
    branch_name: z.string().min(1)
  }),
  z.object({
    action: z.literal("list_branches"),
    project_id: z.string().min(1)
  })
]);

export const spaceshipDnsWriteSchema = z.object({
  action: z.literal("update_records"),
  domain: z.string().min(1),
  records: z.array(z.object({
    domain: z.string().min(1),
    type: z.enum(["A", "CNAME", "TXT", "MX"]),
    name: z.string().min(1),
    value: z.string().min(1),
    ttl: z.number().int().min(60).max(86400)
  })).min(1)
});

export function requireDatabaseEnv() {
  return baseEnvSchema.parse(process.env);
}

export function requireAwsEnv() {
  return awsEnvSchema.parse(process.env);
}

export function requireGithubEnv() {
  return githubEnvSchema.parse(process.env);
}

export function requireVercelEnv() {
  return vercelEnvSchema.parse(process.env);
}

export function requireNeonEnv() {
  return neonEnvSchema.parse(process.env);
}

export function requireSpaceshipEnv() {
  return spaceshipEnvSchema.parse(process.env);
}

function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export function assertAwsWriteAllowed(instanceId: string) {
  const allowlist = parseAllowlist(process.env.AWS_MUTABLE_INSTANCE_IDS);
  if (allowlist.size > 0 && !allowlist.has(instanceId)) {
    throw new Error(`Instance ${instanceId} is not in AWS_MUTABLE_INSTANCE_IDS allowlist.`);
  }
}

export function assertVercelRedeployAllowed(deploymentId: string) {
  const allowlist = parseAllowlist(process.env.VERCEL_REDEPLOY_ALLOWLIST);
  if (allowlist.size > 0 && !allowlist.has(deploymentId)) {
    throw new Error(`Deployment ${deploymentId} is not in VERCEL_REDEPLOY_ALLOWLIST.`);
  }
}

export function assertSpaceshipDnsWriteAllowed(domain: string) {
  const allowlist = parseAllowlist(process.env.SPACESHIP_DNS_WRITE_ALLOWLIST);
  if (allowlist.size > 0 && !allowlist.has(domain)) {
    throw new Error(`Domain ${domain} is not in SPACESHIP_DNS_WRITE_ALLOWLIST.`);
  }
}

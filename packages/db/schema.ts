import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  mode: varchar("mode", { length: 30 }).default("active").notNull(),
  last_synced_at: timestamp("last_synced_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  provider_key_idx: uniqueIndex("providers_key_idx").on(table.key)
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 30 }).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  must_change_password: boolean("must_change_password").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  users_email_idx: uniqueIndex("users_email_idx").on(table.email)
}));

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  sessions_token_idx: uniqueIndex("sessions_token_idx").on(table.token)
}));

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  private: boolean("private").notNull(),
  visibility: varchar("visibility", { length: 40 }).notNull(),
  default_branch: varchar("default_branch", { length: 120 }).notNull(),
  html_url: varchar("html_url", { length: 500 }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  full_name_idx: uniqueIndex("repositories_full_name_idx").on(table.full_name)
}));

export const repositoryBranches = pgTable("repository_branches", {
  id: serial("id").primaryKey(),
  repository_full_name: varchar("repository_full_name", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  protected: boolean("protected").notNull(),
  latest_commit_sha: varchar("latest_commit_sha", { length: 120 }).notNull(),
  latest_commit_message: varchar("latest_commit_message", { length: 1000 }),
  latest_commit_date: timestamp("latest_commit_date", { withTimezone: true }),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  repo_branch_idx: uniqueIndex("repo_branch_idx").on(table.repository_full_name, table.name)
}));

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  instance_id: varchar("instance_id", { length: 120 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  public_ip: varchar("public_ip", { length: 64 }),
  private_ip: varchar("private_ip", { length: 64 }),
  name: varchar("name", { length: 255 }),
  region: varchar("region", { length: 80 }).notNull(),
  instance_type: varchar("instance_type", { length: 80 }),
  availability_zone: varchar("availability_zone", { length: 80 }),
  launch_time: timestamp("launch_time", { withTimezone: true }),
  health_system_status: varchar("health_system_status", { length: 80 }).default("unknown").notNull(),
  health_instance_status: varchar("health_instance_status", { length: 80 }).default("unknown").notNull(),
  tags: jsonb("tags").$type<Record<string, string>>().default({}).notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  instance_id_idx: uniqueIndex("servers_instance_id_idx").on(table.instance_id)
}));

export const ec2Metrics = pgTable("ec2_metrics", {
  id: serial("id").primaryKey(),
  instance_id: varchar("instance_id", { length: 120 }).notNull(),
  metric_name: varchar("metric_name", { length: 80 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  value: doublePrecision("value").notNull(),
  unit: varchar("unit", { length: 30 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  ec2_metric_idx: uniqueIndex("ec2_metric_idx").on(table.instance_id, table.metric_name, table.timestamp)
}));

export const vercelProjects = pgTable("vercel_projects", {
  id: serial("id").primaryKey(),
  project_id: varchar("project_id", { length: 120 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  framework: varchar("framework", { length: 80 }),
  latest_deployment_state: varchar("latest_deployment_state", { length: 80 }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  vercel_project_idx: uniqueIndex("vercel_project_idx").on(table.project_id)
}));

export const vercelDeployments = pgTable("vercel_deployments", {
  id: serial("id").primaryKey(),
  deployment_id: varchar("deployment_id", { length: 120 }).notNull(),
  project_id: varchar("project_id", { length: 120 }).notNull(),
  project_name: varchar("project_name", { length: 255 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  vercel_deployment_idx: uniqueIndex("vercel_deployment_idx").on(table.deployment_id)
}));

export const neonProjects = pgTable("neon_projects", {
  id: serial("id").primaryKey(),
  project_id: varchar("project_id", { length: 120 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  region_id: varchar("region_id", { length: 80 }).notNull(),
  platform_id: varchar("platform_id", { length: 80 }).notNull(),
  created_at_remote: timestamp("created_at_remote", { withTimezone: true }).notNull(),
  updated_at_remote: timestamp("updated_at_remote", { withTimezone: true }).notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  neon_project_idx: uniqueIndex("neon_project_idx").on(table.project_id)
}));

export const neonBranches = pgTable("neon_branches", {
  id: serial("id").primaryKey(),
  branch_id: varchar("branch_id", { length: 120 }).notNull(),
  project_id: varchar("project_id", { length: 120 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  primary: boolean("primary").default(false).notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  neon_branch_idx: uniqueIndex("neon_branch_idx").on(table.branch_id)
}));

export const neonDatabases = pgTable("neon_databases", {
  id: serial("id").primaryKey(),
  database_id: varchar("database_id", { length: 120 }).notNull(),
  project_id: varchar("project_id", { length: 120 }).notNull(),
  branch_id: varchar("branch_id", { length: 120 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  owner_name: varchar("owner_name", { length: 255 }).notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  neon_database_idx: uniqueIndex("neon_database_idx").on(table.database_id)
}));

export const spaceshipDomains = pgTable("spaceship_domains", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull(),
  unicode_name: varchar("unicode_name", { length: 255 }).notNull(),
  lifecycle_status: varchar("lifecycle_status", { length: 80 }).notNull(),
  expiration_date: timestamp("expiration_date", { withTimezone: true }),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  spaceship_domain_idx: uniqueIndex("spaceship_domain_idx").on(table.domain)
}));

export const spaceshipDnsRecords = pgTable("spaceship_dns_records", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  value: varchar("value", { length: 1000 }).notNull(),
  ttl: integer("ttl").notNull(),
  synced_at: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  raw: jsonb("raw").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  spaceship_dns_idx: uniqueIndex("spaceship_dns_idx").on(table.domain, table.type, table.name, table.value)
}));

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  action: varchar("action", { length: 80 }).default("sync").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  started_at: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finished_at: timestamp("finished_at", { withTimezone: true }),
  records_total: integer("records_total").default(0).notNull(),
  records_upserted: integer("records_upserted").default(0).notNull(),
  error_message: varchar("error_message", { length: 1000 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull()
});

export const deploymentRuns = pgTable("deployment_runs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  external_id: varchar("external_id", { length: 120 }).notNull(),
  project_name: varchar("project_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 80 }).notNull(),
  url: varchar("url", { length: 500 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull()
}, (table) => ({
  deployment_external_idx: uniqueIndex("deployment_external_idx").on(table.provider, table.external_id)
}));

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  payload_summary: jsonb("payload_summary").$type<Record<string, unknown>>().default({}).notNull(),
  result: varchar("result", { length: 20 }).notNull(),
  ip: varchar("ip", { length: 100 }).notNull(),
  user_agent: varchar("user_agent", { length: 500 }).notNull(),
  status_code: integer("status_code").notNull(),
  error_message: varchar("error_message", { length: 1000 }),
  duration_ms: integer("duration_ms").notNull(),
  request_id: varchar("request_id", { length: 100 }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

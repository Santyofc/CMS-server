import { pgTable, serial, text, varchar, integer, boolean, timestamp, uniqueIndex, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  hashed_password: text("hashed_password").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  email_idx: uniqueIndex("users_email_idx").on(table.email)
}));

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description")
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  role_id: integer("role_id").references(() => roles.id).notNull(),
  assigned_at: timestamp("assigned_at").defaultNow().notNull()
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 200 }).notNull(),
  repo_name: varchar("repo_name", { length: 255 }).notNull(),
  adapter: varchar("adapter", { length: 80 }).notNull(),
  default_branch: varchar("default_branch", { length: 80 }).default("main").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const repositoryBranches = pgTable("repository_branches", {
  id: serial("id").primaryKey(),
  repository_id: integer("repository_id").references(() => repositories.id).notNull(),
  branch_name: varchar("branch_name", { length: 255 }).notNull(),
  environment: varchar("environment", { length: 80 }).notNull(),
  is_protected: boolean("is_protected").default(false).notNull()
});

export const repositoryAdapters = pgTable("repository_adapters", {
  id: serial("id").primaryKey(),
  repository_id: integer("repository_id").references(() => repositories.id).notNull(),
  framework_type: varchar("framework_type", { length: 80 }).notNull(),
  adapter_key: varchar("adapter_key", { length: 120 }).notNull(),
  config: json("config").$type<Record<string, unknown>>().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const contentEntries = pgTable("content_entries", {
  id: serial("id").primaryKey(),
  repository_id: integer("repository_id").references(() => repositories.id).notNull(),
  entity_slug: varchar("entity_slug", { length: 255 }).notNull(),
  entity_type: varchar("entity_type", { length: 80 }).notNull(),
  data: json("data").$type<Record<string, unknown>>().notNull(),
  environment: varchar("environment", { length: 80 }).notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

export const contentDrafts = pgTable("content_drafts", {
  id: serial("id").primaryKey(),
  content_entry_id: integer("content_entry_id").references(() => contentEntries.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  draft_data: json("draft_data").$type<Record<string, unknown>>().notNull(),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const deploymentHooks = pgTable("deployment_hooks", {
  id: serial("id").primaryKey(),
  repository_id: integer("repository_id").references(() => repositories.id).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  target_env: varchar("target_env", { length: 80 }).notNull(),
  command: text("command").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const deploymentRuns = pgTable("deployment_runs", {
  id: serial("id").primaryKey(),
  deployment_hook_id: integer("deployment_hook_id").references(() => deploymentHooks.id).notNull(),
  triggered_by: integer("triggered_by").references(() => users.id).notNull(),
  status: varchar("status", { length: 80 }).default("pending").notNull(),
  started_at: timestamp("started_at").defaultNow().notNull(),
  finished_at: timestamp("finished_at")
});

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  ip_address: varchar("ip_address", { length: 100 }).notNull(),
  environment: varchar("environment", { length: 80 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({})
});

export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  environment: varchar("environment", { length: 80 }).notNull(),
  server_id: integer("server_id").references(() => servers.id).notNull()
});

export const dnsRecords = pgTable("dns_records", {
  id: serial("id").primaryKey(),
  domain_id: integer("domain_id").references(() => domains.id).notNull(),
  record_type: varchar("record_type", { length: 10 }).notNull(),
  record_value: varchar("record_value", { length: 255 }).notNull(),
  ttl: integer("ttl").default(300).notNull()
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 180 }).notNull(),
  resource: varchar("resource", { length: 180 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at").defaultNow().notNull()
});

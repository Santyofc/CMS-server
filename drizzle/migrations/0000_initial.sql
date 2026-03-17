CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"target" varchar(255) NOT NULL,
	"payload_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" varchar(20) NOT NULL,
	"ip" varchar(100) NOT NULL,
	"user_agent" varchar(500) NOT NULL,
	"status_code" integer NOT NULL,
	"error_message" varchar(1000),
	"duration_ms" integer NOT NULL,
	"request_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"external_id" varchar(120) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"status" varchar(80) NOT NULL,
	"url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ec2_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" varchar(120) NOT NULL,
	"metric_name" varchar(80) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"value" double precision NOT NULL,
	"unit" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neon_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" varchar(120) NOT NULL,
	"project_id" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"primary" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neon_databases" (
	"id" serial PRIMARY KEY NOT NULL,
	"database_id" varchar(120) NOT NULL,
	"project_id" varchar(120) NOT NULL,
	"branch_id" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_name" varchar(255) NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "neon_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"region_id" varchar(80) NOT NULL,
	"platform_id" varchar(80) NOT NULL,
	"created_at_remote" timestamp with time zone NOT NULL,
	"updated_at_remote" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"name" varchar(120) NOT NULL,
	"mode" varchar(30) DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"private" boolean NOT NULL,
	"visibility" varchar(40) NOT NULL,
	"default_branch" varchar(120) NOT NULL,
	"html_url" varchar(500) NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"repository_full_name" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"protected" boolean NOT NULL,
	"latest_commit_sha" varchar(120) NOT NULL,
	"latest_commit_message" varchar(1000),
	"latest_commit_date" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" varchar(120) NOT NULL,
	"state" varchar(80) NOT NULL,
	"public_ip" varchar(64),
	"private_ip" varchar(64),
	"name" varchar(255),
	"region" varchar(80) NOT NULL,
	"instance_type" varchar(80),
	"availability_zone" varchar(80),
	"launch_time" timestamp with time zone,
	"health_system_status" varchar(80) DEFAULT 'unknown' NOT NULL,
	"health_instance_status" varchar(80) DEFAULT 'unknown' NOT NULL,
	"tags" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaceship_dns_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL,
	"type" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" varchar(1000) NOT NULL,
	"ttl" integer NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spaceship_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL,
	"unicode_name" varchar(255) NOT NULL,
	"lifecycle_status" varchar(80) NOT NULL,
	"expiration_date" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"action" varchar(80) DEFAULT 'sync' NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"records_total" integer DEFAULT 0 NOT NULL,
	"records_upserted" integer DEFAULT 0 NOT NULL,
	"error_message" varchar(1000),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vercel_deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"deployment_id" varchar(120) NOT NULL,
	"project_id" varchar(120) NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"state" varchar(80) NOT NULL,
	"url" varchar(500) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vercel_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"framework" varchar(80),
	"latest_deployment_state" varchar(80),
	"updated_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deployment_external_idx" ON "deployment_runs" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ec2_metric_idx" ON "ec2_metrics" USING btree ("instance_id","metric_name","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "neon_branch_idx" ON "neon_branches" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "neon_database_idx" ON "neon_databases" USING btree ("database_id");--> statement-breakpoint
CREATE UNIQUE INDEX "neon_project_idx" ON "neon_projects" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_key_idx" ON "providers" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_full_name_idx" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_branch_idx" ON "repository_branches" USING btree ("repository_full_name","name");--> statement-breakpoint
CREATE UNIQUE INDEX "servers_instance_id_idx" ON "servers" USING btree ("instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "spaceship_dns_idx" ON "spaceship_dns_records" USING btree ("domain","type","name","value");--> statement-breakpoint
CREATE UNIQUE INDEX "spaceship_domain_idx" ON "spaceship_domains" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_deployment_idx" ON "vercel_deployments" USING btree ("deployment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vercel_project_idx" ON "vercel_projects" USING btree ("project_id");
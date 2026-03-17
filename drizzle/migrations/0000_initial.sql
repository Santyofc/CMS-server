-- WARNING: This migration resets control-plane snapshot tables.
DROP TABLE IF EXISTS deployment_runs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sync_runs CASCADE;
DROP TABLE IF EXISTS spaceship_dns_records CASCADE;
DROP TABLE IF EXISTS spaceship_domains CASCADE;
DROP TABLE IF EXISTS neon_databases CASCADE;
DROP TABLE IF EXISTS neon_branches CASCADE;
DROP TABLE IF EXISTS neon_projects CASCADE;
DROP TABLE IF EXISTS vercel_deployments CASCADE;
DROP TABLE IF EXISTS vercel_projects CASCADE;
DROP TABLE IF EXISTS ec2_metrics CASCADE;
DROP TABLE IF EXISTS servers CASCADE;
DROP TABLE IF EXISTS repository_branches CASCADE;
DROP TABLE IF EXISTS repositories CASCADE;
DROP TABLE IF EXISTS providers CASCADE;

CREATE TABLE providers (
  id serial PRIMARY KEY,
  key varchar(50) NOT NULL,
  name varchar(120) NOT NULL,
  mode varchar(30) NOT NULL DEFAULT 'active',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX providers_key_idx ON providers (key);

CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(30) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_idx ON users (email);

CREATE TABLE sessions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  token varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sessions_token_idx ON sessions (token);

CREATE TABLE repositories (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  full_name varchar(255) NOT NULL,
  private boolean NOT NULL,
  visibility varchar(40) NOT NULL,
  default_branch varchar(120) NOT NULL,
  html_url varchar(500) NOT NULL,
  updated_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX repositories_full_name_idx ON repositories (full_name);

CREATE TABLE repository_branches (
  id serial PRIMARY KEY,
  repository_full_name varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  protected boolean NOT NULL,
  latest_commit_sha varchar(120) NOT NULL,
  latest_commit_message varchar(1000),
  latest_commit_date timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX repo_branch_idx ON repository_branches (repository_full_name, name);

CREATE TABLE servers (
  id serial PRIMARY KEY,
  instance_id varchar(120) NOT NULL,
  state varchar(80) NOT NULL,
  public_ip varchar(64),
  private_ip varchar(64),
  name varchar(255),
  region varchar(80) NOT NULL,
  instance_type varchar(80),
  availability_zone varchar(80),
  launch_time timestamptz,
  health_system_status varchar(80) NOT NULL DEFAULT 'unknown',
  health_instance_status varchar(80) NOT NULL DEFAULT 'unknown',
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX servers_instance_id_idx ON servers (instance_id);

CREATE TABLE ec2_metrics (
  id serial PRIMARY KEY,
  instance_id varchar(120) NOT NULL,
  metric_name varchar(80) NOT NULL,
  timestamp timestamptz NOT NULL,
  value double precision NOT NULL,
  unit varchar(30) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ec2_metric_idx ON ec2_metrics (instance_id, metric_name, timestamp);

CREATE TABLE vercel_projects (
  id serial PRIMARY KEY,
  project_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  framework varchar(80),
  latest_deployment_state varchar(80),
  updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX vercel_project_idx ON vercel_projects (project_id);

CREATE TABLE vercel_deployments (
  id serial PRIMARY KEY,
  deployment_id varchar(120) NOT NULL,
  project_id varchar(120) NOT NULL,
  project_name varchar(255) NOT NULL,
  state varchar(80) NOT NULL,
  url varchar(500) NOT NULL,
  created_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX vercel_deployment_idx ON vercel_deployments (deployment_id);

CREATE TABLE neon_projects (
  id serial PRIMARY KEY,
  project_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  region_id varchar(80) NOT NULL,
  platform_id varchar(80) NOT NULL,
  created_at_remote timestamptz NOT NULL,
  updated_at_remote timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX neon_project_idx ON neon_projects (project_id);

CREATE TABLE neon_branches (
  id serial PRIMARY KEY,
  branch_id varchar(120) NOT NULL,
  project_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  primary boolean NOT NULL DEFAULT false,
  default boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX neon_branch_idx ON neon_branches (branch_id);

CREATE TABLE neon_databases (
  id serial PRIMARY KEY,
  database_id varchar(120) NOT NULL,
  project_id varchar(120) NOT NULL,
  branch_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  owner_name varchar(255) NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX neon_database_idx ON neon_databases (database_id);

CREATE TABLE spaceship_domains (
  id serial PRIMARY KEY,
  domain varchar(255) NOT NULL,
  unicode_name varchar(255) NOT NULL,
  lifecycle_status varchar(80) NOT NULL,
  expiration_date timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX spaceship_domain_idx ON spaceship_domains (domain);

CREATE TABLE spaceship_dns_records (
  id serial PRIMARY KEY,
  domain varchar(255) NOT NULL,
  type varchar(10) NOT NULL,
  name varchar(255) NOT NULL,
  value varchar(1000) NOT NULL,
  ttl integer NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX spaceship_dns_idx ON spaceship_dns_records (domain, type, name, value);

CREATE TABLE sync_runs (
  id serial PRIMARY KEY,
  provider varchar(50) NOT NULL,
  action varchar(80) NOT NULL DEFAULT 'sync',
  status varchar(20) NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  records_total integer NOT NULL DEFAULT 0,
  records_upserted integer NOT NULL DEFAULT 0,
  error_message varchar(1000),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE deployment_runs (
  id serial PRIMARY KEY,
  provider varchar(50) NOT NULL,
  external_id varchar(120) NOT NULL,
  project_name varchar(255) NOT NULL,
  status varchar(80) NOT NULL,
  url varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX deployment_external_idx ON deployment_runs (provider, external_id);

CREATE TABLE audit_logs (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  action varchar(100) NOT NULL,
  provider varchar(50) NOT NULL,
  target varchar(255) NOT NULL,
  payload_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  result varchar(20) NOT NULL,
  ip varchar(100) NOT NULL,
  user_agent varchar(500) NOT NULL,
  status_code integer NOT NULL,
  error_message varchar(1000),
  duration_ms integer NOT NULL,
  request_id varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

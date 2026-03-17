
CREATE TABLE IF NOT EXISTS providers (
  id serial PRIMARY KEY,
  key varchar(50) NOT NULL,
  name varchar(120) NOT NULL,
  mode varchar(30) NOT NULL DEFAULT 'active',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS providers_key_idx ON providers (key);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(30) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  token varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_idx ON sessions (token);

CREATE TABLE IF NOT EXISTS repositories (
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
CREATE UNIQUE INDEX IF NOT EXISTS repositories_full_name_idx ON repositories (full_name);

CREATE TABLE IF NOT EXISTS repository_branches (
  id serial PRIMARY KEY,
  repository_full_name varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  protected boolean NOT NULL,
  latest_commit_sha varchar(120) NOT NULL,
  latest_commit_message varchar(1000),
  latest_commit_date timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS repo_branch_idx ON repository_branches (repository_full_name, name);

CREATE TABLE IF NOT EXISTS servers (
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
CREATE UNIQUE INDEX IF NOT EXISTS servers_instance_id_idx ON servers (instance_id);

CREATE TABLE IF NOT EXISTS ec2_metrics (
  id serial PRIMARY KEY,
  instance_id varchar(120) NOT NULL,
  metric_name varchar(80) NOT NULL,
  timestamp timestamptz NOT NULL,
  value double precision NOT NULL,
  unit varchar(30) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ec2_metric_idx ON ec2_metrics (instance_id, metric_name, timestamp);

CREATE TABLE IF NOT EXISTS vercel_projects (
  id serial PRIMARY KEY,
  project_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  framework varchar(80),
  latest_deployment_state varchar(80),
  updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS vercel_project_idx ON vercel_projects (project_id);

CREATE TABLE IF NOT EXISTS vercel_deployments (
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
CREATE UNIQUE INDEX IF NOT EXISTS vercel_deployment_idx ON vercel_deployments (deployment_id);

CREATE TABLE IF NOT EXISTS neon_projects (
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
CREATE UNIQUE INDEX IF NOT EXISTS neon_project_idx ON neon_projects (project_id);

CREATE TABLE IF NOT EXISTS neon_branches (
  id serial PRIMARY KEY,
  branch_id varchar(120) NOT NULL,
  project_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  primary boolean NOT NULL DEFAULT false,
  default boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS neon_branch_idx ON neon_branches (branch_id);

CREATE TABLE IF NOT EXISTS neon_databases (
  id serial PRIMARY KEY,
  database_id varchar(120) NOT NULL,
  project_id varchar(120) NOT NULL,
  branch_id varchar(120) NOT NULL,
  name varchar(255) NOT NULL,
  owner_name varchar(255) NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS neon_database_idx ON neon_databases (database_id);

CREATE TABLE IF NOT EXISTS spaceship_domains (
  id serial PRIMARY KEY,
  domain varchar(255) NOT NULL,
  unicode_name varchar(255) NOT NULL,
  lifecycle_status varchar(80) NOT NULL,
  expiration_date timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS spaceship_domain_idx ON spaceship_domains (domain);

CREATE TABLE IF NOT EXISTS spaceship_dns_records (
  id serial PRIMARY KEY,
  domain varchar(255) NOT NULL,
  type varchar(10) NOT NULL,
  name varchar(255) NOT NULL,
  value varchar(1000) NOT NULL,
  ttl integer NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS spaceship_dns_idx ON spaceship_dns_records (domain, type, name, value);

CREATE TABLE IF NOT EXISTS sync_runs (
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

CREATE TABLE IF NOT EXISTS deployment_runs (
  id serial PRIMARY KEY,
  provider varchar(50) NOT NULL,
  external_id varchar(120) NOT NULL,
  project_name varchar(255) NOT NULL,
  status varchar(80) NOT NULL,
  url varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE UNIQUE INDEX IF NOT EXISTS deployment_external_idx ON deployment_runs (provider, external_id);

CREATE TABLE IF NOT EXISTS audit_logs (
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



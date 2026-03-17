export type AwsInstanceDto = {
  instance_id: string;
  state: string;
  public_ip: string | null;
  private_ip: string | null;
  name: string | null;
  region: string;
  instance_type: string | null;
  availability_zone: string | null;
  launch_time: string | null;
  health: {
    system_status: string;
    instance_status: string;
  };
  tags: Record<string, string>;
};

export type MetricPointDto = {
  metric: string;
  timestamp: string;
  value: number;
  unit: string;
};

export type GithubRepoDto = {
  full_name: string;
  name: string;
  visibility: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  updated_at: string;
  branches: Array<{
    name: string;
    protected: boolean;
    latest_commit_sha: string;
  }>;
  latest_commit: {
    sha: string;
    message: string;
    author_date: string;
    html_url: string;
  } | null;
  open_prs: number;
};

export type VercelProjectDto = {
  project_id: string;
  name: string;
  framework: string | null;
  latest_deployment_state: string | null;
  updated_at: string | null;
  domains: string[];
};

export type NeonProjectDto = {
  project_id: string;
  name: string;
  region_id: string;
  platform_id: string;
  branches: Array<{ id: string; name: string; primary: boolean; is_default: boolean }>;
  databases: Array<{ id: string; branch_id: string; name: string; owner_name: string }>;
  compute: Array<{ id: string; branch_id: string; type: string; current_state: string }>;
};

export type SpaceshipDnsDto = {
  domain: string;
  drift_detected: boolean;
  drift_notes: string[];
  records: Array<{ type: string; name: string; value: string; ttl: number }>;
};

export type DashboardSummaryDto = {
  totals: {
    repositories: number;
    instances: number;
    vercel_projects: number;
    neon_projects: number;
    domains: number;
    dns_records: number;
  };
  cloudwatch: MetricPointDto[];
  timeline: Array<{
    provider: string;
    action: string;
    status: string;
    finished_at: string | null;
    records_total: number;
  }>;
};

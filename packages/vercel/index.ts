const VERCEL_API_BASE = "https://api.vercel.com";

export type VercelProject = {
  id: string;
  name: string;
  framework: string | null;
  latest_deployment_state: string | null;
  updated_at: string | null;
  domains: string[];
};

export type VercelDeployment = {
  id: string;
  project_id: string;
  project_name: string;
  state: string;
  url: string;
  created_at: string;
};

export interface VercelProvider {
  listProjects(): Promise<VercelProject[]>;
  listDeployments(limit?: number): Promise<VercelDeployment[]>;
  redeploy(deploymentId: string): Promise<{ id: string; state: string }>;
}

type VercelEnv = {
  token: string;
  teamId?: string;
};

async function vercelRequest<T>(env: VercelEnv, path: string, init?: RequestInit): Promise<T> {
  const url = new URL(`${VERCEL_API_BASE}${path}`);
  if (env.teamId) {
    url.searchParams.set("teamId", env.teamId);
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Vercel API error (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

export class RestVercelProvider implements VercelProvider {
  private readonly env: VercelEnv;

  constructor(env: VercelEnv) {
    if (!env.token) {
      throw new Error("VERCEL_TOKEN is required.");
    }

    this.env = env;
  }

  async listProjects(): Promise<VercelProject[]> {
    const projectsResponse = await vercelRequest<{ projects: Array<Record<string, unknown>> }>(
      this.env,
      "/v9/projects"
    );

    const projects = projectsResponse.projects ?? [];

    const withDomains = await Promise.all(projects.map(async (project) => {
      const id = String(project.id);
      const name = String(project.name);
      const domainsResponse = await vercelRequest<{ domains: Array<{ name?: string }> }>(
        this.env,
        `/v9/projects/${encodeURIComponent(id)}/domains`
      );

      return {
        id,
        name,
        framework: typeof project.framework === "string" ? project.framework : null,
        latest_deployment_state: typeof project.latestDeployments === "object" && project.latestDeployments !== null
          ? null
          : null,
        updated_at: typeof project.updatedAt === "number"
          ? new Date(project.updatedAt).toISOString()
          : null,
        domains: (domainsResponse.domains ?? []).map((d) => d.name).filter((d): d is string => Boolean(d))
      } satisfies VercelProject;
    }));

    return withDomains;
  }

  async listDeployments(limit = 20): Promise<VercelDeployment[]> {
    const path = `/v6/deployments?limit=${Math.max(1, Math.min(limit, 100))}`;
    const response = await vercelRequest<{ deployments: Array<Record<string, unknown>> }>(this.env, path);

    return (response.deployments ?? []).map((deployment) => ({
      id: String(deployment.uid ?? deployment.id),
      project_id: String(deployment.projectId ?? "unknown"),
      project_name: String(deployment.name ?? "unknown"),
      state: String(deployment.state ?? "unknown"),
      url: String(deployment.url ?? ""),
      created_at: typeof deployment.created === "number"
        ? new Date(deployment.created).toISOString()
        : new Date().toISOString()
    }));
  }

  async redeploy(deploymentId: string): Promise<{ id: string; state: string }> {
    const response = await vercelRequest<{ id?: string; uid?: string; state?: string }>(
      this.env,
      `/v13/deployments/${encodeURIComponent(deploymentId)}/redeploy`,
      { method: "POST", body: JSON.stringify({}) }
    );

    return {
      id: response.uid ?? response.id ?? deploymentId,
      state: response.state ?? "queued"
    };
  }
}

export function createVercelProvider(env: NodeJS.ProcessEnv = process.env): VercelProvider {
  const token = env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN is required.");
  }

  return new RestVercelProvider({
    token,
    teamId: env.VERCEL_TEAM_ID
  });
}

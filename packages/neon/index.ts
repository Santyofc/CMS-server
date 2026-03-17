const NEON_API_BASE = "https://console.neon.tech/api/v2";

export type NeonProject = {
  id: string;
  name: string;
  region_id: string;
  platform_id: string;
  created_at: string;
  updated_at: string;
};

export type NeonBranch = {
  id: string;
  project_id: string;
  name: string;
  primary: boolean;
  is_default: boolean;
};

export type NeonDatabase = {
  id: number;
  project_id: string;
  branch_id: string;
  name: string;
  owner_name: string;
};

export type NeonEndpoint = {
  id: string;
  project_id: string;
  branch_id: string;
  type: string;
  current_state: string;
};

export interface NeonProvider {
  listProjects(): Promise<NeonProject[]>;
  listBranches(projectId: string): Promise<NeonBranch[]>;
  createBranch(projectId: string, branchName: string): Promise<NeonBranch>;
  listDatabases(projectId: string, branchId: string): Promise<NeonDatabase[]>;
  listEndpoints(projectId: string): Promise<NeonEndpoint[]>;
}

async function neonRequest<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${NEON_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Neon API error (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

export class RestNeonProvider implements NeonProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("NEON_API_KEY is required.");
    }

    this.apiKey = apiKey;
  }

  async listProjects(): Promise<NeonProject[]> {
    const response = await neonRequest<{ projects: Array<Record<string, unknown>> }>(this.apiKey, "/projects");

    return (response.projects ?? []).map((project) => ({
      id: String(project.id),
      name: String(project.name),
      region_id: String(project.region_id ?? ""),
      platform_id: String(project.platform_id ?? ""),
      created_at: String(project.created_at ?? new Date().toISOString()),
      updated_at: String(project.updated_at ?? new Date().toISOString())
    }));
  }

  async listBranches(projectId: string): Promise<NeonBranch[]> {
    const response = await neonRequest<{ branches: Array<Record<string, unknown>> }>(
      this.apiKey,
      `/projects/${encodeURIComponent(projectId)}/branches`
    );

    return (response.branches ?? []).map((branch) => ({
      id: String(branch.id),
      project_id: String(branch.project_id ?? projectId),
      name: String(branch.name),
      primary: Boolean(branch.primary),
      is_default: Boolean(branch.default)
    }));
  }

  async createBranch(projectId: string, branchName: string): Promise<NeonBranch> {
    const response = await neonRequest<{ branch: Record<string, unknown> }>(
      this.apiKey,
      `/projects/${encodeURIComponent(projectId)}/branches`,
      {
        method: "POST",
        body: JSON.stringify({ branch: { name: branchName } })
      }
    );

    const branch = response.branch;

    return {
      id: String(branch.id),
      project_id: String(branch.project_id ?? projectId),
      name: String(branch.name ?? branchName),
      primary: Boolean(branch.primary),
      is_default: Boolean(branch.default)
    };
  }

  async listDatabases(projectId: string, branchId: string): Promise<NeonDatabase[]> {
    const response = await neonRequest<{ databases: Array<Record<string, unknown>> }>(
      this.apiKey,
      `/projects/${encodeURIComponent(projectId)}/branches/${encodeURIComponent(branchId)}/databases`
    );

    return (response.databases ?? []).map((database) => ({
      id: Number(database.id ?? 0),
      project_id: projectId,
      branch_id: branchId,
      name: String(database.name ?? ""),
      owner_name: String(database.owner_name ?? "")
    }));
  }

  async listEndpoints(projectId: string): Promise<NeonEndpoint[]> {
    const response = await neonRequest<{ endpoints: Array<Record<string, unknown>> }>(
      this.apiKey,
      `/projects/${encodeURIComponent(projectId)}/endpoints`
    );

    return (response.endpoints ?? []).map((endpoint) => ({
      id: String(endpoint.id),
      project_id: String(endpoint.project_id ?? projectId),
      branch_id: String(endpoint.branch_id ?? ""),
      type: String(endpoint.type ?? ""),
      current_state: String(endpoint.current_state ?? "unknown")
    }));
  }
}

export function createNeonProvider(env: NodeJS.ProcessEnv = process.env): NeonProvider {
  const apiKey = env.NEON_API_KEY;
  if (!apiKey) {
    throw new Error("NEON_API_KEY is required.");
  }

  return new RestNeonProvider(apiKey);
}

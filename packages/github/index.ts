import { Octokit } from "octokit";

export type GithubBranch = {
  name: string;
  protected: boolean;
  latest_commit_sha: string;
};

export type GithubRepository = {
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  updated_at: string;
  visibility: string;
  branches: GithubBranch[];
  latest_commit: {
    sha: string;
    message: string;
    author_date: string;
    html_url: string;
  } | null;
  open_prs: number;
};

export interface GithubProvider {
  listRepositories(): Promise<GithubRepository[]>;
}

export class OctokitGithubProvider implements GithubProvider {
  private readonly octokit: Octokit;

  constructor(token: string) {
    if (!token) {
      throw new Error("GITHUB_TOKEN is required.");
    }

    this.octokit = new Octokit({ auth: token });
  }

  private async listBranches(owner: string, repo: string): Promise<GithubBranch[]> {
    const branches = await this.octokit.paginate(this.octokit.rest.repos.listBranches, {
      owner,
      repo,
      per_page: 100
    });

    return branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      latest_commit_sha: branch.commit.sha
    }));
  }

  private async getLatestCommit(owner: string, repo: string): Promise<GithubRepository["latest_commit"]> {
    const response = await this.octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 1
    });

    const commit = response.data[0];
    if (!commit) {
      return null;
    }

    return {
      sha: commit.sha,
      message: commit.commit.message,
      author_date: commit.commit.author?.date ?? new Date().toISOString(),
      html_url: commit.html_url
    };
  }

  private async getOpenPrCount(owner: string, repo: string): Promise<number> {
    const response = await this.octokit.rest.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:pr is:open`,
      per_page: 1
    });

    return response.data.total_count;
  }

  async listRepositories(): Promise<GithubRepository[]> {
    const repos = await this.octokit.paginate(this.octokit.rest.repos.listForAuthenticatedUser, {
      per_page: 100,
      sort: "updated",
      affiliation: "owner,collaborator,organization_member"
    });

    const mapped = await Promise.all(repos.map(async (repo) => {
      const owner = repo.owner?.login;
      if (!owner) {
        return null;
      }

      const [branches, latestCommit, openPrs] = await Promise.all([
        this.listBranches(owner, repo.name),
        this.getLatestCommit(owner, repo.name),
        this.getOpenPrCount(owner, repo.name)
      ]);

      return {
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        default_branch: repo.default_branch ?? "main",
        html_url: repo.html_url,
        updated_at: repo.updated_at ?? new Date().toISOString(),
        visibility: repo.visibility ?? (repo.private ? "private" : "public"),
        branches,
        latest_commit: latestCommit,
        open_prs: openPrs
      } satisfies GithubRepository;
    }));

    return mapped.filter((repo): repo is GithubRepository => repo !== null);
  }
}

export function createGithubProvider(env: NodeJS.ProcessEnv = process.env): GithubProvider {
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is required.");
  }

  // TODO: Replace token-based auth with GitHub App installation tokens.
  return new OctokitGithubProvider(token);
}

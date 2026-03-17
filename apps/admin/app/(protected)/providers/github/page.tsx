import { unstable_noStore as noStore } from "next/cache";
import { listGithubRepos } from "@/lib/services/providers/github";
import { requirePageAccess } from "@/lib/security/page";

export default async function GithubProviderPage() {
  noStore();
  await requirePageAccess("viewer");
  const repos = await listGithubRepos();

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>GitHub Provider</h1>
      <p>Repositorios, branches y último commit (sin mocks).</p>
      <div style={{ display: "grid", gap: 12 }}>
        {repos.map((repo) => (
          <article key={repo.full_name} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <h2 style={{ margin: "0 0 6px" }}>
              <a href={repo.html_url} target="_blank" rel="noreferrer">{repo.full_name}</a>
            </h2>
            <p style={{ margin: "0 0 6px" }}>Visibilidad: {repo.visibility} | Branch por defecto: {repo.default_branch}</p>
            <p style={{ margin: "0 0 6px" }}>PRs abiertas: {repo.open_prs}</p>
            <p style={{ margin: "0 0 6px" }}>Último commit: {repo.latest_commit?.sha.slice(0, 8) ?? "-"} - {repo.latest_commit?.message ?? "-"}</p>
            <p style={{ margin: 0 }}>Branches: {repo.branches.map((branch) => branch.name).join(", ") || "-"}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

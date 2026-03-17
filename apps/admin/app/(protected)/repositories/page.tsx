import { unstable_noStore as noStore } from "next/cache";
import { listGithubRepos } from "@/lib/services/providers/github";
import { requirePageAccess } from "@/lib/security/page";

export default async function RepositoriesPage() {
  noStore();
  await requirePageAccess("viewer");
  const repos = await listGithubRepos();

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Repositories</h1>
      <p>Vista legacy conectada a GitHub real.</p>
      <ul style={{ paddingLeft: 18 }}>
        {repos.map((repo) => (
          <li key={repo.full_name}>{repo.full_name} ({repo.visibility})</li>
        ))}
      </ul>
    </main>
  );
}

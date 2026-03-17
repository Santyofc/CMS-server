import { unstable_noStore as noStore } from "next/cache";
import { listNeonProjects } from "@/lib/services/providers/neon";
import { requirePageAccess } from "@/lib/security/page";

export default async function NeonProviderPage() {
  noStore();
  await requirePageAccess("viewer");
  const projects = await listNeonProjects();

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Neon Provider</h1>
      <p>Proyectos, branches, databases y compute (endpoints) reales.</p>
      <div style={{ display: "grid", gap: 12 }}>
        {projects.map((project) => (
          <article key={project.project_id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>{project.name}</h2>
            <p>Region: {project.region_id} | Platform: {project.platform_id}</p>
            <p>Branches: {project.branches.map((branch) => branch.name).join(", ") || "-"}</p>
            <p>Databases: {project.databases.map((database) => database.name).join(", ") || "-"}</p>
            <p style={{ marginBottom: 0 }}>Compute: {project.compute.map((endpoint) => `${endpoint.id}:${endpoint.current_state}`).join(", ") || "-"}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

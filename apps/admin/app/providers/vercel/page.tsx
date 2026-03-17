import { unstable_noStore as noStore } from "next/cache";
import { listVercelDeployments, listVercelProjects } from "@/lib/services/providers/vercel";

export default async function VercelProviderPage() {
  noStore();
  const [projects, deployments] = await Promise.all([
    listVercelProjects(),
    listVercelDeployments(20)
  ]);
  const success = deployments.filter((deployment) => deployment.state === "READY").length;
  const failed = deployments.filter((deployment) => deployment.state === "ERROR").length;
  const lastDeploy = deployments[0];

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Vercel Provider</h1>
      <p>Proyectos, deployments y dominios reales. Redeploy disponible por endpoint seguro allowlisted.</p>

      <section style={{ marginBottom: 16 }}>
        <h2>Projects</h2>
        <ul style={{ paddingLeft: 18 }}>
          {projects.map((project) => (
            <li key={project.project_id}>
              {project.name} | {project.framework ?? "-"} | status: {project.latest_deployment_state ?? "-"} | dominios: {project.domains.join(", ") || "-"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Recent Deployments</h2>
        <p>
          Exitosos: {success} | Fallidos: {failed} | Último deploy: {lastDeploy ? new Date(lastDeploy.created_at).toLocaleString("es-CR") : "-"}
        </p>
        <ul style={{ paddingLeft: 18 }}>
          {deployments.map((deployment) => (
            <li key={deployment.deployment_id}>
              {deployment.project_name} - {deployment.state} - {deployment.url}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

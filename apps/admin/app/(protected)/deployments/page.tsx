import { unstable_noStore as noStore } from "next/cache";
import { listDeploymentRuns } from "@/lib/services/deployments";
import DeployButton from "./DeployButton";
import { requirePageAccess } from "@/lib/security/page";

export default async function DeploymentsPage() {
  noStore();
  await requirePageAccess("viewer");
  const runs = await listDeploymentRuns(50);
  const latestSystemDeploy = runs.find((run) => run.provider === "system");
  const success = runs.filter((run) => run.status.toLowerCase() === "ready" || run.status.toLowerCase() === "success").length;
  const failed = runs.filter((run) => run.status.toLowerCase() === "error" || run.status.toLowerCase() === "failed").length;
  const byDay = new Map<string, number>();
  for (const run of runs) {
    const day = run.created_at.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Deployments</h1>
      <p>Timeline real de deployment runs persistidos.</p>
      <DeployButton />
      <p>Exitosos: {success} | Fallidos: {failed} | Último deploy: {runs[0] ? runs[0].created_at.toLocaleString("es-CR") : "-"}</p>
      <p>Último deploy del CMS: {latestSystemDeploy ? `${latestSystemDeploy.status} @ ${latestSystemDeploy.created_at.toLocaleString("es-CR")}` : "sin ejecuciones"}</p>
      <h2>Deploys por día</h2>
      <ul style={{ paddingLeft: 18 }}>
        {Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([day, count]) => (
          <li key={day}>{day}: {count}</li>
        ))}
      </ul>
      <ul style={{ paddingLeft: 18 }}>
        {runs.map((run) => (
          <li key={`${run.provider}-${run.external_id}`}>
            {run.provider} | {run.project_name} | {run.status} | {run.url ?? "-"}
          </li>
        ))}
      </ul>
    </main>
  );
}

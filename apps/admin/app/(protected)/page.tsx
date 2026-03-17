import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getDashboardSummary } from "@/lib/services/dashboard";
import { requirePageAccess } from "@/lib/security/page";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, StatCard } from "@/components/ui/panel";

export default async function Home() {
  noStore();
  await requirePageAccess("viewer");
  const summary = await getDashboardSummary();

  const cards = [
    { label: "Repos", value: summary.totals.repositories, meta: "GitHub inventory" },
    { label: "Instancias", value: summary.totals.instances, meta: "EC2 sincronizadas" },
    { label: "Vercel", value: summary.totals.vercel_projects, meta: "Projects activos" },
    { label: "Neon", value: summary.totals.neon_projects, meta: "Projects detectados" },
    { label: "Dominios", value: summary.totals.domains, meta: "Inventario DNS" },
    { label: "DNS Records", value: summary.totals.dns_records, meta: "Registros mapeados" }
  ];

  return (
    <main className="stack-md">
      <PageHeader
        eyebrow="Overview"
        title="Operación en tiempo real"
        description="Panel unificado para health, sincronización, proveedores y despliegues. Todo sale de datos reales persistidos."
        actions={(
          <div className="page-header-actions">
            <Badge tone="success">Health OK</Badge>
            <Badge tone="success">Readiness OK</Badge>
          </div>
        )}
      />

      <section className="stats-grid">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} meta={card.meta} />
        ))}
      </section>

      <section className="grid-2">
        <Panel title="Health y providers" subtitle="Estado resumido de runtime y sincronización por proveedor.">
          <ul className="list-reset">
            <li className="status-row">
              <div className="timeline-title">
                <strong>Runtime</strong>
                <span>Proceso del panel operativo</span>
              </div>
              <Badge tone="success">healthy</Badge>
            </li>
            <li className="status-row">
              <div className="timeline-title">
                <strong>Database readiness</strong>
                <span>El dashboard está resolviendo consultas reales</span>
              </div>
              <Badge tone="success">ready</Badge>
            </li>
            {summary.providers.map((provider) => (
              <li key={provider.key} className="status-row">
                <div className="timeline-title">
                  <strong>{provider.name}</strong>
                  <span>Último sync: {provider.last_synced_at ? new Date(provider.last_synced_at).toLocaleString("es-CR") : "pendiente"}</span>
                </div>
                <Badge tone={provider.mode === "active" ? "success" : "warning"}>{provider.mode}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Quick actions" subtitle="Entradas rápidas para operación frecuente.">
          <div className="quick-actions">
            <Link href="/providers/aws" className="action-link">
              <strong>AWS Infra</strong>
              <span>Revisa EC2, health checks y métricas recientes.</span>
            </Link>
            <Link href="/providers/github" className="action-link">
              <strong>GitHub repos</strong>
              <span>Verifica repositorios, branches y actividad reciente.</span>
            </Link>
            <Link href="/deployments" className="action-link">
              <strong>Deployments</strong>
              <span>Abre el historial y ejecuta despliegues del panel.</span>
            </Link>
            <Link href="/users" className="action-link">
              <strong>Usuarios</strong>
              <span>Gestiona roles, altas y activaciones del equipo.</span>
            </Link>
          </div>
        </Panel>
      </section>

      <section className="grid-2">
        <Panel title="CloudWatch reciente" subtitle="Últimos puntos almacenados en la cache de métricas.">
          <ul className="list-reset">
            {summary.cloudwatch.slice(0, 12).map((point) => (
              <li key={`${point.metric}-${point.timestamp}`} className="status-row">
                <div className="timeline-title">
                  <strong>{point.metric}</strong>
                  <span>{new Date(point.timestamp).toLocaleString("es-CR")} · {point.unit}</span>
                </div>
                <Badge tone="info">{point.value.toFixed(2)}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Syncs recientes" subtitle="Últimos trabajos persistidos en la timeline operativa.">
          <ul className="list-reset">
            {summary.timeline.slice(0, 12).map((run, index) => (
              <li key={`${run.provider}-${run.action}-${index}`} className="timeline-row">
                <div className="timeline-title">
                  <strong>{run.provider}/{run.action}</strong>
                  <span>
                    {run.records_total} registros · {run.finished_at ? new Date(run.finished_at).toLocaleString("es-CR") : "en curso"}
                  </span>
                </div>
                <Badge tone={run.status === "success" ? "success" : run.status === "running" ? "info" : "warning"}>{run.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="grid-2">
        <Panel title="Últimos deployments" subtitle="Señal inmediata de releases recientes.">
          <ul className="list-reset">
            {summary.deployments.map((deployment) => (
              <li key={`${deployment.provider}-${deployment.project_name}-${deployment.created_at}`} className="timeline-row">
                <div className="timeline-title">
                  <strong>{deployment.project_name}</strong>
                  <span>{deployment.provider} · {new Date(deployment.created_at).toLocaleString("es-CR")}</span>
                </div>
                <Badge tone={deployment.status.toLowerCase().includes("error") ? "danger" : "success"}>{deployment.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Accesos y operación" subtitle="Capas listas para crecer con equipo y control de cambios.">
          <div className="stack-sm helper-text">
            <span>• Login separado del shell operativo</span>
            <span>• Roles centralizados: owner, admin, operator, viewer</span>
            <span>• Gestión real de usuarios con auditoría y validación server-side</span>
            <span>• Navegación consistente para módulos de infraestructura, deploys y acceso</span>
          </div>
        </Panel>
      </section>
    </main>
  );
}

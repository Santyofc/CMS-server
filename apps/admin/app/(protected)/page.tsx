import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { getDashboardSummary } from "@/lib/services/dashboard";
import { requirePageAccess } from "@/lib/security/page";

export default async function Home() {
  noStore();
  await requirePageAccess("viewer");
  const summary = await getDashboardSummary();

  const cards = [
    { label: "Repos", value: summary.totals.repositories },
    { label: "Instancias", value: summary.totals.instances },
    { label: "Vercel", value: summary.totals.vercel_projects },
    { label: "Neon", value: summary.totals.neon_projects },
    { label: "Dominios", value: summary.totals.domains },
    { label: "DNS Records", value: summary.totals.dns_records }
  ];

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 36 }}>CMS Business Control Plane</h1>
        <p style={{ color: "#4b5563" }}>Servicios reales conectados y sincronización operativa.</p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
        {cards.map((card) => (
          <article key={card.label} style={{ background: "#fff", padding: 14, borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{card.label}</p>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700 }}>{card.value}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <article style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>CloudWatch (últimos puntos)</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.cloudwatch.slice(0, 12).map((point) => (
              <li key={`${point.metric}-${point.timestamp}`}>{point.metric}: {point.value.toFixed(2)} ({new Date(point.timestamp).toLocaleString("es-CR")})</li>
            ))}
          </ul>
        </article>

        <article style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
          <h2 style={{ marginTop: 0 }}>Timeline de Syncs</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.timeline.slice(0, 12).map((run, index) => (
              <li key={`${run.provider}-${run.action}-${index}`}>
                {run.provider}/{run.action} - {run.status} - {run.records_total} registros
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/providers/aws">AWS</Link>
        <Link href="/providers/github">GitHub</Link>
        <Link href="/providers/vercel">Vercel</Link>
        <Link href="/providers/neon">Neon</Link>
        <Link href="/providers/spaceship">Spaceship</Link>
        <Link href="/metrics">Metrics</Link>
        <Link href="/deployments">Deployments</Link>
      </section>
    </main>
  );
}

import { unstable_noStore as noStore } from "next/cache";
import { getDashboardSummary } from "@/lib/services/dashboard";

export default async function MetricsPage() {
  noStore();
  const summary = await getDashboardSummary();

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Metrics</h1>
      <p>CloudWatch cacheado en Postgres desde sync y consultas reales.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Metric</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Value</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Unit</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {summary.cloudwatch.map((point) => (
            <tr key={`${point.metric}-${point.timestamp}`}>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{point.metric}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{point.value.toFixed(2)}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{point.unit}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{new Date(point.timestamp).toLocaleString("es-CR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

import { unstable_noStore as noStore } from "next/cache";
import { getAwsMetrics, listAwsInstances } from "@/lib/services/providers/aws";
import AwsMetricsClient from "./AwsMetricsClient";

export default async function AwsProviderPage() {
  noStore();
  const instances = await listAwsInstances();
  const first = instances[0];
  const metrics = first ? await getAwsMetrics(first.instance_id, 6) : [];

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>AWS Provider</h1>
      <p>EC2 real + CloudWatch. Acciones write vía `POST /api/providers/aws/actions` con allowlist.</p>

      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Instance</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>State</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Public IP</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Private IP</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Name</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Region</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Type</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>AZ</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Uptime</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Health</th>
          </tr>
        </thead>
        <tbody>
          {instances.map((instance) => (
            <tr key={instance.instance_id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.instance_id}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.state}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.public_ip ?? "-"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.private_ip ?? "-"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.name ?? "-"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.region}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.instance_type ?? "-"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{instance.availability_zone ?? "-"}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {instance.launch_time
                  ? `${Math.max(0, Math.floor((Date.now() - new Date(instance.launch_time).getTime()) / (1000 * 60 * 60)))}h`
                  : "-"}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                {instance.health.system_status}/{instance.health.instance_status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {first ? <AwsMetricsClient instanceId={first.instance_id} initial={metrics} /> : null}
    </main>
  );
}

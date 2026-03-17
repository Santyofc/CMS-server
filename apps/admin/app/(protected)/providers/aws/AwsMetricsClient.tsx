"use client";

import { useEffect, useMemo, useState } from "react";

type MetricPoint = {
  metric: string;
  timestamp: string;
  value: number;
  unit: string;
};

type Props = {
  instanceId: string;
  initial: MetricPoint[];
};

const METRICS = [
  "CPUUtilization",
  "CPUCreditBalance",
  "NetworkIn",
  "NetworkOut",
  "DiskReadOps",
  "DiskWriteOps",
  "StatusCheckFailed"
];

function buildPolyline(points: MetricPoint[]): string {
  if (points.length === 0) {
    return "";
  }

  const sorted = [...points].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const values = sorted.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return sorted
    .map((point, index) => {
      const x = (index / Math.max(1, sorted.length - 1)) * 100;
      const y = 100 - ((point.value - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function AwsMetricsClient({ instanceId, initial }: Props) {
  const [hours, setHours] = useState(6);
  const [data, setData] = useState<MetricPoint[]>(initial);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      const response = await fetch(`/api/providers/aws/metrics?instance_id=${encodeURIComponent(instanceId)}&hours=${hours}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      if (!cancelled) {
        setData(payload.data ?? []);
      }
    }

    fetchMetrics();
    const timer = setInterval(fetchMetrics, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [hours, instanceId]);

  const grouped = useMemo(() => {
    const map = new Map<string, MetricPoint[]>();
    for (const metric of METRICS) {
      map.set(metric, []);
    }

    for (const point of data) {
      if (!map.has(point.metric)) {
        map.set(point.metric, []);
      }

      map.get(point.metric)!.push(point);
    }

    return map;
  }, [data]);

  return (
    <section style={{ marginTop: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>CloudWatch (refresh 30s)</h2>
        <label>
          Rango: 
          <select value={hours} onChange={(event) => setHours(Number(event.target.value))}>
            <option value={1}>1h</option>
            <option value={6}>6h</option>
            <option value={12}>12h</option>
            <option value={24}>24h</option>
            <option value={72}>72h</option>
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
        {METRICS.map((metric) => {
          const points = grouped.get(metric) ?? [];
          const polyline = buildPolyline(points);
          const last = points.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

          return (
            <article key={metric} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{metric}</p>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 90, background: "#f9fafb" }}>
                <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={polyline} />
              </svg>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#4b5563" }}>
                Último: {last ? `${last.value.toFixed(2)} ${last.unit}` : "sin datos"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

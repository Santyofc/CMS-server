"use client";
import { useEffect, useState } from "react";

type Domain = { id: string; domain: string; target: string; environment: string; serverId: string };

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    fetch("/api/domains").then((r) => r.json()).then((d) => setDomains(d.data || []));
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1024, margin: "0 auto" }}>
      <h1>Dominios</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>Dominio</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>IP</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>Entorno</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>Servidor</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{d.domain}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{d.target}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{d.environment}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{d.serverId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

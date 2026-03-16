"use client";
import { useEffect, useState } from "react";

type Server = { id: string; name: string; ip: string; environment: string; status: string };

export default function InfraPage() {
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    fetch("/api/infra").then((r) => r.json()).then((d) => setServers(d.data || []));
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1024, margin: "0 auto" }}>
      <h1>Infraestructura</h1>
      <p>Servidores registrados y acciones de operaciones seguras.</p>
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {servers.map((server) => (
          <li key={server.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 12, padding: 12 }}>
            <strong>{server.name}</strong> • {server.ip} • {server.environment} • {server.status}
          </li>
        ))}
      </ul>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";

type Repo = { id: string; name: string; private: boolean; adapter: string };

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);

  useEffect(() => {
    fetch("/api/repositories").then((r) => r.json()).then((d) => setRepos(d.data || []));
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1024, margin: "0 auto" }}>
      <h1>Repositorios</h1>
      <p>Conecta repositorios, asigna adapters y configura entornos.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>Nombre</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>Adapter</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: 8 }}>Privado</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => (
            <tr key={repo.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{repo.name}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{repo.adapter}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>{repo.private ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

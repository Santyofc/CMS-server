import Link from "next/link";

const quickStats = [
  { label: "Repositorios", value: 3 },
  { label: "Servidores", value: 2 },
  { label: "Entornos", value: 3 },
  { label: "Despliegues", value: 7 }
];

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <p style={{ color: "#6b7280", marginBottom: 8 }}>Control Plane</p>
        <h1 style={{ margin: 0, fontSize: 36 }}>ZonaSurTech Core Platform</h1>
        <p style={{ marginTop: 8, color: "#374151" }}>
          Centro de operaciones para contenido, deploy, repositorios y infra.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {quickStats.map((stat) => (
          <article key={stat.label} style={{ background: "white", borderRadius: 10, padding: 12, border: "1px solid #e5e7eb" }}>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>{stat.label}</p>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700 }}>{stat.value}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Link href="/repositories" style={{ textDecoration: "none" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
            <h2>Repositorios</h2>
            <p>Gestiona conexiones, adapters y entidades editables.</p>
          </div>
        </Link>
        <Link href="/infra" style={{ textDecoration: "none" }}>
          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e5e7eb" }}>
            <h2>Infra y Ops</h2>
            <p>Servidores, dominios, entornos y acciones seguras.</p>
          </div>
        </Link>
      </section>
    </main>
  );
}

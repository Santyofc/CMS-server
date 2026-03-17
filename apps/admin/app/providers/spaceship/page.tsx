import { unstable_noStore as noStore } from "next/cache";
import { getSpaceMailStatus, listSpaceshipDns } from "@/lib/services/providers/spaceship";

export default async function SpaceshipProviderPage() {
  noStore();
  const [dns, spacemail] = await Promise.all([
    listSpaceshipDns(),
    getSpaceMailStatus()
  ]);

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Spaceship Provider</h1>
      <p>DNS real (A/CNAME/TXT/MX). Escritura restringida por allowlist.</p>

      <section style={{ marginBottom: 16 }}>
        <h2>DNS Records</h2>
        {dns.map((domain) => (
          <article key={domain.domain} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <h3 style={{ marginTop: 0 }}>{domain.domain}</h3>
            <p style={{ marginTop: 0 }}>
              Drift: {domain.drift_detected ? "Detectado" : "No"}
              {domain.drift_notes.length > 0 ? ` (${domain.drift_notes.join("; ")})` : ""}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {domain.records.map((record, index) => (
                <li key={`${record.type}-${record.name}-${index}`}>{record.type} {record.name} -&gt; {record.value} (TTL {record.ttl})</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>SpaceMail</h2>
        <p style={{ margin: 0 }}>Modo: {spacemail.mode}. {spacemail.reason}</p>
      </section>
    </main>
  );
}

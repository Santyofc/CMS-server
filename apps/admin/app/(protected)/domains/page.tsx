import { unstable_noStore as noStore } from "next/cache";
import { listSpaceshipDns } from "@/lib/services/providers/spaceship";
import { requirePageAccess } from "@/lib/security/page";

export default async function DomainsPage() {
  noStore();
  await requirePageAccess("viewer");
  const domains = await listSpaceshipDns();

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Domains</h1>
      <p>Vista legacy conectada a Spaceship DNS real.</p>
      <ul style={{ paddingLeft: 18 }}>
        {domains.map((domain) => (
          <li key={domain.domain}>{domain.domain} ({domain.records.length} records)</li>
        ))}
      </ul>
    </main>
  );
}

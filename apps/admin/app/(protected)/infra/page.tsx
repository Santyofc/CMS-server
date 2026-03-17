import { unstable_noStore as noStore } from "next/cache";
import { listAwsInstances } from "@/lib/services/providers/aws";
import { requirePageAccess } from "@/lib/security/page";

export default async function InfraPage() {
  noStore();
  await requirePageAccess("viewer");
  const instances = await listAwsInstances();

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Infra</h1>
      <p>Vista legacy conectada a AWS real.</p>
      <ul style={{ paddingLeft: 18 }}>
        {instances.map((instance) => (
          <li key={instance.instance_id}>{instance.instance_id} - {instance.state}</li>
        ))}
      </ul>
    </main>
  );
}

import { unstable_noStore as noStore } from "next/cache";
import UsersManagement from "@/components/users/users-management";
import { PageHeader } from "@/components/ui/page-header";
import { getUserRoles, listUsers } from "@/lib/services/users";
import { requirePageAccess } from "@/lib/security/page";

export default async function UsersPage() {
  noStore();
  const currentUser = await requirePageAccess("admin");
  const users = await listUsers();

  return (
    <main className="stack-md">
      <PageHeader
        eyebrow="Access"
        title="Usuarios y roles"
        description="Gestión operativa de accesos, activación de cuentas y asignación de roles sin tocar la base manualmente."
      />

      <UsersManagement
        initialUsers={users}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        availableRoles={getUserRoles()}
      />
    </main>
  );
}

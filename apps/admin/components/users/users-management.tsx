"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserListItemDto } from "@/lib/dto/users";
import type { Role } from "@/lib/security/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/form";
import { Panel } from "@/components/ui/panel";
import { DataTable } from "@/components/ui/table";

type UsersManagementProps = {
  initialUsers: UserListItemDto[];
  currentUserId: number;
  currentUserRole: Role;
  availableRoles: Role[];
};

type FilterRole = Role | "all";
type FilterStatus = "all" | "active" | "inactive";

export default function UsersManagement({
  initialUsers,
  currentUserId,
  currentUserRole,
  availableRoles
}: UsersManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState<FilterRole>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserListItemDto | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: currentUserRole === "owner" ? "admin" : "operator",
    mustChangePassword: true
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (statusFilter === "active" && !user.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && user.isActive) {
        return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter]);

  async function reloadUsers() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("role", roleFilter);
      params.set("status", statusFilter);
      const response = await fetch(`/api/users?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible refrescar usuarios");
      }

      setUsers(payload.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible refrescar usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function submitCreateUser() {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible crear el usuario");
      }

      setShowCreate(false);
      setForm({
        email: "",
        password: "",
        role: currentUserRole === "owner" ? "admin" : "operator",
        mustChangePassword: true
      });
      setMessage(`Usuario ${payload.data.email} creado correctamente. Password temporal: ${payload.data.temporaryPassword}`);
      await reloadUsers();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible crear el usuario");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(userId: number, body: Record<string, unknown>, successMessage: string) {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible actualizar el usuario");
      }

      const issuedPassword = payload.data?.temporaryPassword as string | undefined;
      setMessage(issuedPassword ? `${successMessage}. Password temporal: ${issuedPassword}` : successMessage);
      await reloadUsers();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible actualizar el usuario");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-md">
      <Panel
        title="Usuarios operativos"
        subtitle="Alta, cambio de rol, activación y emisión de passwords temporales sobre el sistema real."
        actions={(
          <div className="panel-actions">
            <Button variant="secondary" onClick={() => void reloadUsers()} disabled={loading || submitting}>
              {loading ? "Actualizando..." : "Refrescar"}
            </Button>
            <Button onClick={() => setShowCreate(true)} disabled={submitting}>
              Nuevo usuario
            </Button>
          </div>
        )}
      >
        <div className="toolbar" style={{ marginBottom: 18 }}>
          <Field label="Rol">
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as FilterRole)}>
              <option value="all">Todos</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Select>
          </Field>

          <Field label="Estado">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}>
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </Select>
          </Field>
        </div>

        {message ? (
          <div className="alert" style={{ marginBottom: 16, background: "#effaf5", borderColor: "rgba(15, 159, 110, 0.2)", color: "#0f7a56" }}>
            <strong>Operación exitosa</strong>
            <span>{message}</span>
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <strong>Error</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No hay usuarios para estos filtros"
            description="Ajusta los filtros o crea una cuenta nueva para empezar a operar con el equipo."
            action={<Button onClick={() => setShowCreate(true)}>Crear primer usuario</Button>}
          />
        ) : (
          <DataTable
            head={(
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Password</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            )}
          >
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="table-meta">
                    <strong>{user.email}</strong>
                    <span>ID #{user.id}</span>
                  </div>
                </td>
                <td>
                  <Select
                    value={user.role}
                    onChange={(event) => void updateUser(user.id, { type: "role", role: event.target.value }, `Rol de ${user.email} actualizado`)}
                    disabled={submitting || (currentUserRole !== "owner" && (user.role === "admin" || user.role === "owner")) || currentUserId === user.id}
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </Select>
                </td>
                <td>
                  <Badge tone={user.isActive ? "success" : "warning"}>{user.isActive ? "active" : "inactive"}</Badge>
                </td>
                <td>
                  <Badge tone={user.mustChangePassword ? "warning" : "success"}>
                    {user.mustChangePassword ? "must change" : "ready"}
                  </Badge>
                </td>
                <td>{new Date(user.createdAt).toLocaleString("es-CR")}</td>
                <td>
                  <div className="table-actions">
                    <Button
                      variant={user.isActive ? "ghost" : "secondary"}
                      disabled={submitting || currentUserId === user.id || (currentUserRole !== "owner" && (user.role === "admin" || user.role === "owner"))}
                      onClick={() => {
                        const nextStatus = !user.isActive;
                        const confirmed = window.confirm(
                          nextStatus
                            ? `Activar a ${user.email}?`
                            : `Desactivar a ${user.email}?`
                        );

                        if (confirmed) {
                          void updateUser(
                            user.id,
                            { type: "status", isActive: nextStatus },
                            `Estado de ${user.email} actualizado`
                          );
                        }
                      }}
                    >
                      {user.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={submitting || (currentUserRole !== "owner" && (user.role === "admin" || user.role === "owner"))}
                      onClick={() => {
                        setResetTarget(user);
                        setResetPassword("");
                      }}
                    >
                      Reset password
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {showCreate ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header>
              <span className="eyebrow">Usuarios</span>
              <h3>Crear usuario operativo</h3>
              <p>Se almacena password hasheada. Si no indicas una clave inicial, el sistema genera una temporal segura.</p>
            </header>

            <div className="stack-lg">
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="persona@zonasurtech.online"
                />
              </Field>

              <Field label="Password inicial" hint="Opcional. Si la dejas vacía, se genera y se muestra una sola vez.">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Generar automáticamente"
                />
              </Field>

              <Field label="Rol">
                <Select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
                >
                  {availableRoles
                    .filter((role) => currentUserRole === "owner" || role === "operator" || role === "viewer")
                    .map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                </Select>
              </Field>

              <label className="helper-text" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={form.mustChangePassword}
                  onChange={(event) => setForm((current) => ({ ...current, mustChangePassword: event.target.checked }))}
                />
                Forzar cambio de password en el primer login
              </label>
            </div>

            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={() => void submitCreateUser()} loading={submitting}>
                Crear usuario
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {resetTarget ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header>
              <span className="eyebrow">Reset</span>
              <h3>Resetear contraseña</h3>
              <p>
                Se emitirá una contraseña temporal para {resetTarget.email}. La cuenta quedará marcada con
                <span className="mono"> must_change_password</span>.
              </p>
            </header>

            <div className="stack-lg">
              <Field label="Nueva contraseña temporal" hint="Opcional. Si la dejas vacía, el backend genera una.">
                <Input
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="Generar automáticamente"
                />
              </Field>
            </div>

            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setResetTarget(null)} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  void updateUser(
                    resetTarget.id,
                    { type: "reset_password", password: resetPassword },
                    `Password reseteada para ${resetTarget.email}`
                  );
                  setResetTarget(null);
                }}
                loading={submitting}
              >
                Emitir temporal
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

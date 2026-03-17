import type { ReactNode } from "react";
import type { AuthUser } from "@/lib/security/auth";
import AppNavigation from "@/components/shell/app-navigation";
import LogoutButton from "@/app/LogoutButton";
import { Badge } from "@/components/ui/badge";

export default function AppShell({
  user,
  children
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">CP</span>
          <div>
            <strong>CMS Control Plane</strong>
            <small>Ops workspace</small>
          </div>
        </div>
        <AppNavigation />
      </aside>

      <div className="app-shell-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Control plane</span>
            <h2>Operación centralizada</h2>
          </div>

          <div className="topbar-actions">
            <Badge tone="success">Runtime online</Badge>
            <div className="user-chip">
              <div>
                <strong>{user.email}</strong>
                <span>{user.role}</span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>

        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

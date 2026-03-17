import { redirect } from "next/navigation";
import PasswordSetupForm from "@/components/auth/password-setup-form";
import { getCurrentUser } from "@/lib/security/auth";

export default async function SetupPasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.mustChangePassword) {
    redirect("/");
  }

  return (
    <main className="auth-panel-wrap">
      <section className="auth-copy">
        <span className="eyebrow">Password rotation</span>
        <h1>Necesitas actualizar tu contraseña antes de operar el panel.</h1>
        <p>
          Esta cuenta fue creada o reseteada con una contraseña temporal. Define una nueva contraseña
          para habilitar el acceso completo al control plane.
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow">Security</span>
          <h2>Configura tu contraseña</h2>
          <p>El cambio rotará tu sesión actual y deshabilitará el flag de password temporal.</p>
        </div>
        <PasswordSetupForm email={user.email} />
      </section>
    </main>
  );
}

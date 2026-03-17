import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="auth-panel-wrap">
      <section className="auth-copy">
        <span className="eyebrow">Business Control Plane</span>
        <h1>Opera infraestructura, deploys y proveedores desde un único panel.</h1>
        <p>
          Acceso seguro para equipos técnicos. Gestión de AWS, GitHub, Neon, Vercel y dominios con
          trazabilidad real.
        </p>
        <div className="auth-highlights">
          <div className="feature-card">
            <strong>Estado operativo</strong>
            <span>Health, readiness, syncs y deployments en un solo flujo.</span>
          </div>
          <div className="feature-card">
            <strong>Control por roles</strong>
            <span>Owner, admin, operator y viewer con permisos server-side.</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <span className="eyebrow">Acceso</span>
          <h2>Inicia sesión</h2>
          <p>Usa tu cuenta operativa para entrar al panel.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}

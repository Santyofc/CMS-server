export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-grid" />
      <div className="auth-shell">
        {children}
      </div>
    </div>
  );
}

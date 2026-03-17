import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "CMS Control Plane",
  description: "Control Plane operativo multi-provider"
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/providers/aws", label: "AWS" },
  { href: "/providers/github", label: "GitHub" },
  { href: "/providers/vercel", label: "Vercel" },
  { href: "/providers/neon", label: "Neon" },
  { href: "/providers/spaceship", label: "Spaceship" },
  { href: "/metrics", label: "Metrics" },
  { href: "/deployments", label: "Deployments" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
          <nav style={{ borderBottom: "1px solid #d1d5db", background: "#ffffff" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              {links.map((link) => (
                <Link key={link.href} href={link.href} style={{ color: "#111827", textDecoration: "none", fontWeight: 600 }}>
                  {link.label}
                </Link>
              ))}
              <div style={{ marginLeft: "auto" }}>
                <LogoutButton />
              </div>
            </div>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Control Plane",
  description: "Plataforma central para ecosistema digital"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
          {children}
        </div>
      </body>
    </html>
  );
}

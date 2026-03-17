"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "No fue posible iniciar sesión" }));
        setError(payload.error ?? "No fue posible iniciar sesión");
        setLoading(false);
        return;
      }

      const payload = await response.json();
      router.push(payload.data?.mustChangePassword ? "/setup-password" : "/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar sesión");
      setLoading(false);
      return;
    }
  }

  return (
    <form className="stack-lg" onSubmit={onSubmit}>
      <Field label="Email" hint="Cuenta operativa del control plane">
        <Input
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="ops@zonasurtech.online"
          required
        />
      </Field>

      <Field label="Password">
        <Input
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Tu contraseña"
          required
        />
      </Field>

      {error ? (
        <div className="alert alert-error" role="alert">
          <strong>Error de acceso</strong>
          <span>{error}</span>
        </div>
      ) : null}

      <Button type="submit" loading={loading} className="button-block">
        {loading ? "Validando..." : "Entrar al panel"}
      </Button>
    </form>
  );
}

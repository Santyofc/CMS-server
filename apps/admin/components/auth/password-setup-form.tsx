"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export default function PasswordSetupForm({ email }: { email: string }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (nextPassword !== confirmation) {
      setError("La nueva contraseña y la confirmación no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          nextPassword
        })
      });
      const payload = await response.json().catch(() => ({ error: "No fue posible actualizar la contraseña" }));

      if (!response.ok) {
        setError(payload.error ?? "No fue posible actualizar la contraseña");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible actualizar la contraseña");
      setLoading(false);
    }
  }

  return (
    <form className="stack-lg" onSubmit={onSubmit}>
      <div className="helper-text">Cuenta: {email}</div>

      <Field label="Contraseña temporal actual">
        <Input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </Field>

      <Field label="Nueva contraseña" hint="Mínimo 10 caracteres. Evita reutilizar contraseñas operativas antiguas.">
        <Input
          type="password"
          autoComplete="new-password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          required
        />
      </Field>

      <Field label="Confirmar nueva contraseña">
        <Input
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
        />
      </Field>

      {error ? (
        <div className="alert alert-error" role="alert">
          <strong>Error</strong>
          <span>{error}</span>
        </div>
      ) : null}

      <Button type="submit" loading={loading} className="button-block">
        {loading ? "Aplicando..." : "Actualizar contraseña"}
      </Button>
    </form>
  );
}

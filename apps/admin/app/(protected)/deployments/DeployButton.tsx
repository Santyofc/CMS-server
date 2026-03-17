"use client";

import { useState } from "react";

export default function DeployButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleDeploy() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/deploy", { method: "POST" });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(payload.error ?? "Deploy failed");
      setLoading(false);
      return;
    }

    setMessage(`Deploy ${payload.data?.status ?? "ok"}`);
    setLoading(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={handleDeploy} disabled={loading}>
        {loading ? "Deploying..." : "Deploy"}
      </button>
      {message ? <p style={{ margin: "8px 0 0" }}>{message}</p> : null}
    </div>
  );
}

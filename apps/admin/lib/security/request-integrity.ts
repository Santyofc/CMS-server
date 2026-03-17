import { NextRequest, NextResponse } from "next/server";

function parseExpectedOrigin() {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return null;
  }

  try {
    return new URL(appUrl).origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeSingleValue(value: string | null) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

function parseForwardedValues(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function enforceSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  const trustedForwardedHosts = process.env.TRUST_PROXY === "true"
    ? parseForwardedValues(request.headers.get("x-forwarded-host"))
    : [];
  const effectiveHost = trustedForwardedHosts[0] ?? normalizeSingleValue(host);

  const forwardedProtos = process.env.TRUST_PROXY === "true"
    ? parseForwardedValues(request.headers.get("x-forwarded-proto"))
    : [];

  if (!origin || !effectiveHost) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
    };
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
    };
  }

  const originHost = originUrl.host.toLowerCase();
  const originProto = originUrl.protocol.replace(":", "").toLowerCase();

  if (originHost !== effectiveHost) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 })
    };
  }

  if (forwardedProtos.length > 0 && !forwardedProtos.includes(originProto)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Protocol mismatch" }, { status: 403 })
    };
  }

  const expectedOrigin = parseExpectedOrigin();
  if (expectedOrigin && originUrl.origin.toLowerCase() !== expectedOrigin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Origin not allowed" }, { status: 403 })
    };
  }

  return {
    ok: true as const
  };
}

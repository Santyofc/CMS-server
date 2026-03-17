import { NextRequest, NextResponse } from "next/server";

function parseExpectedOrigin() {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return null;
  }

  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
}

export function enforceSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const trustedForwardedHost = process.env.TRUST_PROXY === "true"
    ? request.headers.get("x-forwarded-host")
    : null;
  const effectiveHost = trustedForwardedHost ?? host;
  const forwardedProto = request.headers.get("x-forwarded-proto");

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

  if (originUrl.host !== effectiveHost) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 })
    };
  }

  if (forwardedProto && originUrl.protocol.replace(":", "") !== forwardedProto) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Protocol mismatch" }, { status: 403 })
    };
  }

  const expectedOrigin = parseExpectedOrigin();
  if (expectedOrigin && originUrl.origin !== expectedOrigin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Origin not allowed" }, { status: 403 })
    };
  }

  return {
    ok: true as const
  };
}

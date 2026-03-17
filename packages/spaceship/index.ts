const SPACESHIP_API_BASE = "https://spaceship.dev/api";

export type SpaceshipDomain = {
  name: string;
  unicode_name: string;
  lifecycle_status: string;
  expiration_date: string;
};

export type SpaceshipDnsRecord = {
  domain: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
};

export interface SpaceshipProvider {
  listDomains(): Promise<SpaceshipDomain[]>;
  listDnsRecords(domain: string): Promise<SpaceshipDnsRecord[]>;
  saveDnsRecords(domain: string, records: SpaceshipDnsRecord[]): Promise<void>;
}

type SpaceshipEnv = {
  apiKey: string;
  apiSecret: string;
};

async function spaceshipRequest<T>(env: SpaceshipEnv, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SPACESHIP_API_BASE}${path}`, {
    ...init,
    headers: {
      "X-API-Key": env.apiKey,
      "X-API-Secret": env.apiSecret,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Spaceship API error (${response.status}): ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export class RestSpaceshipProvider implements SpaceshipProvider {
  private readonly env: SpaceshipEnv;

  constructor(env: SpaceshipEnv) {
    if (!env.apiKey || !env.apiSecret) {
      throw new Error("SPACESHIP_API_KEY and SPACESHIP_API_SECRET are required.");
    }

    this.env = env;
  }

  async listDomains(): Promise<SpaceshipDomain[]> {
    const response = await spaceshipRequest<{ items: Array<Record<string, unknown>> }>(
      this.env,
      "/v1/domains?take=100&skip=0"
    );

    return (response.items ?? []).map((domain) => ({
      name: String(domain.name ?? ""),
      unicode_name: String(domain.unicodeName ?? domain.name ?? ""),
      lifecycle_status: String(domain.lifecycleStatus ?? "unknown"),
      expiration_date: String(domain.expirationDate ?? "")
    }));
  }

  async listDnsRecords(domain: string): Promise<SpaceshipDnsRecord[]> {
    const response = await spaceshipRequest<{ items: Array<Record<string, unknown>> }>(
      this.env,
      `/v1/dns-records/${encodeURIComponent(domain)}?take=500&skip=0`
    );

    return (response.items ?? []).map((record) => {
      const type = String(record.type ?? "");
      const value = typeof record.address === "string"
        ? record.address
        : typeof record.exchange === "string"
          ? record.exchange
          : typeof record.text === "string"
            ? record.text
            : String(record.value ?? "");

      return {
        domain,
        type,
        name: String(record.name ?? "@"),
        value,
        ttl: Number(record.ttl ?? 300)
      };
    });
  }

  async saveDnsRecords(domain: string, records: SpaceshipDnsRecord[]): Promise<void> {
    const payload = {
      force: true,
      items: records.map((record) => ({
        type: record.type,
        name: record.name,
        ttl: record.ttl,
        value: record.value,
        address: record.value,
        exchange: record.value,
        text: record.value,
        priority: 10
      }))
    };

    await spaceshipRequest<void>(
      this.env,
      `/v1/dns-records/${encodeURIComponent(domain)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload)
      }
    );
  }
}

export function createSpaceshipProvider(env: NodeJS.ProcessEnv = process.env): SpaceshipProvider {
  const apiKey = env.SPACESHIP_API_KEY;
  const apiSecret = env.SPACESHIP_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("SPACESHIP_API_KEY and SPACESHIP_API_SECRET are required.");
  }

  return new RestSpaceshipProvider({ apiKey, apiSecret });
}

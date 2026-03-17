import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readDatabaseUrlFromEnvFile() {
  const envFile = path.join(rootDir, ".env");
  if (!existsSync(envFile)) {
    return null;
  }

  const contents = readFileSync(envFile, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (key !== "DATABASE_URL") {
      continue;
    }

    const value = line.slice(separatorIndex + 1).trim();
    return stripWrappingQuotes(value);
  }

  return null;
}

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? readDatabaseUrlFromEnvFile();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for Drizzle. Export it in the shell or set it in /var/www/cms/.env before running pnpm db:generate or pnpm db:migrate."
    );
  }

  return databaseUrl;
}

export default defineConfig({
  schema: "./packages/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl()
  }
});

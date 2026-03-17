import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
let client: postgres.Sql | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Set it in /var/www/cms/.env or export it before starting the app.");
  }

  client = postgres(databaseUrl, { max: 1 });
  dbInstance = drizzle(client, { schema });

  return dbInstance;
}

export type Db = ReturnType<typeof getDb>;
export * from "./schema";

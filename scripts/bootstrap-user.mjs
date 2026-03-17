import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const APP_ROLES = new Set(["owner", "admin", "operator", "viewer"]);

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function parseArgs(argv) {
  const values = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const nextValue = argv[index + 1];
    values[key] = nextValue;
    index += 1;
  }

  return values;
}

async function main() {
  loadEnvFile();

  const args = parseArgs(process.argv.slice(2));
  const email = String(args.email ?? "").trim().toLowerCase();
  const password = String(args.password ?? "");
  const role = String(args.role ?? "owner").trim().toLowerCase();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Create /var/www/cms/.env or export it before running bootstrap.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Provide a valid email with --email user@example.com");
  }

  if (password.length < 10) {
    throw new Error("Provide a password with at least 10 characters via --password");
  }

  if (!APP_ROLES.has(role)) {
    throw new Error("Invalid role. Allowed values: owner, admin, operator, viewer");
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    const existing = await sql`select id, email from users where email = ${email} limit 1`;
    if (existing.length > 0) {
      throw new Error(`A user with email ${email} already exists`);
    }

    const passwordHash = hashPassword(password);
    await sql`
      insert into users (email, password_hash, role, is_active)
      values (${email}, ${passwordHash}, ${role}, true)
    `;

    console.log(`User ${email} created with role ${role}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

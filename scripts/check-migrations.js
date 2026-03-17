const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");
const forbiddenPatterns = [
  { pattern: /\bDROP\s+TABLE\b/i, reason: "DROP TABLE" },
  { pattern: /\bDROP\s+COLUMN\b/i, reason: "DROP COLUMN" },
  { pattern: /\bTRUNCATE\b/i, reason: "TRUNCATE" },
  { pattern: /\bDELETE\s+FROM\b(?![\s\S]*\bWHERE\b)/i, reason: "DELETE FROM without WHERE" }
];

if (!fs.existsSync(migrationsDir)) {
  process.exit(0);
}

const migrationFiles = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql"));
const violations = [];

for (const file of migrationFiles) {
  const fullPath = path.join(migrationsDir, file);
  const contents = fs.readFileSync(fullPath, "utf8");

  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(contents)) {
      violations.push(`${file}: contains forbidden pattern "${rule.reason}"`);
    }
  }
}

if (violations.length > 0) {
  console.error("Unsafe migration patterns detected:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

/**
 * MCPHub Database Setup Script
 * Verifies DATABASE_URL and runs Drizzle schema push.
 *
 * Usage: npx tsx scripts/setup-db.ts
 */
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (
    !dbUrl ||
    dbUrl === "postgresql://..." ||
    dbUrl.includes("user:password")
  ) {
    console.error("Error: DATABASE_URL is not configured.");
    console.error("");
    console.error("Steps:");
    console.error("  1. Create a free database at https://neon.tech");
    console.error("  2. Copy the connection string");
    console.error("  3. Set it in .env.local:");
    console.error("     DATABASE_URL=postgresql://...");
    console.error("");
    process.exit(1);
  }

  console.log("Database URL configured. Pushing schema...\n");

  try {
    execSync("npx drizzle-kit push", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log("\nSchema pushed successfully!");
    console.log("You can now run: npm run dev");
  } catch {
    console.error(
      "\nFailed to push schema. Check your DATABASE_URL and try again."
    );
    process.exit(1);
  }
}

main();

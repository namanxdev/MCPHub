import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization — defer neon() call until first use so that the module
// can be imported during build without a valid DATABASE_URL.
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url || url === "postgresql://...") {
      throw new Error(
        "DATABASE_URL is not configured. Set a valid Neon connection string."
      );
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Convenience proxy that behaves like the original `db` export.
// Property accesses are forwarded to the lazily-initialised instance.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>];
  },
});

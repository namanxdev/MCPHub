// lib/security/registry-import.ts
import { db } from "../db/index.js";
import { servers } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateSlug } from "../utils/index.js";
import { validateOutboundUrl } from "../utils/validate-url.js";
import type { RegistryEntry } from "./types.js";

export interface RawRemote { type?: string; url?: string }
export interface RawEntry { name?: string; description?: string; version?: string; remotes?: RawRemote[] }

/** Pure: map one official-registry entry to a normalized RegistryEntry, or null if no streamable-http remote. */
export function mapRegistryEntry(entry: RawEntry): RegistryEntry | null {
  const remote = (entry.remotes ?? []).find((r) => r.type === "streamable-http" && !!r.url);
  if (!remote?.url) return null;
  const name = entry.name ?? remote.url;
  const title = name.includes("/") ? name.slice(name.lastIndexOf("/") + 1) : name;
  return {
    name,
    title,
    description: entry.description ?? "",
    version: entry.version ?? "",
    url: remote.url,
  };
}

const OFFICIAL_REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers";

/** Fetch + paginate the official registry, upsert streamable-http servers into Postgres. */
export async function seedRegistryFromOfficial(opts: { limit?: number; maxPages?: number } = {}): Promise<{
  imported: number; skipped: number; scanned: number;
}> {
  const limit = opts.limit ?? 100;
  const maxPages = opts.maxPages ?? 5;
  let imported = 0, skipped = 0, scanned = 0;

  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(`${OFFICIAL_REGISTRY}?limit=${limit}&offset=${page * limit}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) break;
    const body = (await res.json()) as { servers?: unknown };
    const rawList: RawEntry[] = Array.isArray(body?.servers) ? (body.servers as RawEntry[]) : [];
    if (rawList.length === 0) break;
    scanned += rawList.length;

    for (const raw of rawList) {
      const entry = mapRegistryEntry(raw);
      if (!entry) { skipped++; continue; }
      // SSRF/public-only guard before persisting a URL this server will later connect to.
      const guard = await validateOutboundUrl(entry.url, { allowLocalhost: false });
      if (!guard.ok) { skipped++; continue; }

      const existing = await db.select({ id: servers.id }).from(servers).where(eq(servers.url, entry.url)).limit(1);
      if (existing.length > 0) { skipped++; continue; }

      const slug = await uniqueSlug(entry.title || entry.name);
      const authorName = entry.name.includes("/") ? entry.name.split("/")[0] : "MCP Registry";
      await db.insert(servers).values({
        name: entry.title || entry.name,
        slug,
        url: entry.url,
        transportType: "streamable-http",
        serverType: "hosted",
        shortDescription: (entry.description || entry.name).slice(0, 280),
        longDescription: entry.description || null,
        authorName,
        categories: ["imported"],
        tags: entry.version ? [`v${entry.version}`] : [],
        status: "active",
      });
      imported++;
    }
    if (rawList.length < limit) break;
  }
  return { imported, skipped, scanned };
}

async function uniqueSlug(base: string): Promise<string> {
  const root = generateSlug(base) || "server";
  let slug = root;
  for (let i = 2; ; i++) {
    const clash = await db.select({ id: servers.id }).from(servers).where(eq(servers.slug, slug)).limit(1);
    if (clash.length === 0) return slug;
    slug = `${root}-${i}`;
  }
}

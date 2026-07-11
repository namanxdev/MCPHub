// lib/security/registry-import.ts
import { db } from "../db/index.js";
import { servers } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateSlug } from "../utils/index.js";
import { validateOutboundUrl } from "../utils/validate-url.js";
import type { RegistryEntry } from "./types.js";

export interface RawRemote { type?: string; url?: string }
export interface RawServer {
  name?: string;
  title?: string;
  description?: string;
  version?: string;
  remotes?: RawRemote[];
}
/**
 * A registry list item. The official MCP registry wraps the server object under
 * `server` (`{ server: {...}, _meta: {...} }`); we also accept a flat shape.
 */
export interface RawEntry extends RawServer {
  server?: RawServer;
}

/** Pure: map one official-registry entry to a normalized RegistryEntry, or null if no streamable-http remote. */
export function mapRegistryEntry(raw: RawEntry): RegistryEntry | null {
  const entry: RawServer = raw.server ?? raw;
  const remote = (entry.remotes ?? []).find((r) => r.type === "streamable-http" && !!r.url);
  if (!remote?.url) return null;
  const name = entry.name ?? remote.url;
  const title =
    entry.title ?? (name.includes("/") ? name.slice(name.lastIndexOf("/") + 1) : name);
  return {
    name,
    title,
    description: entry.description ?? "",
    version: entry.version ?? "",
    url: remote.url,
  };
}

const OFFICIAL_REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers";

/** Fetch one registry page with a generous timeout + retries (the API can be slow). */
async function fetchRegistryPage(url: string, attempts = 3): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(60000),
      });
      // Retry transient 5xx; give up on 4xx (won't improve on retry).
      if (res.ok || res.status < 500) return res;
    } catch {
      // timeout / network error → fall through to retry
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

/** Fetch + paginate the official registry, upsert streamable-http servers into Postgres. */
export async function seedRegistryFromOfficial(opts: { limit?: number; maxPages?: number } = {}): Promise<{
  imported: number; skipped: number; scanned: number;
}> {
  const limit = opts.limit ?? 100;
  const maxPages = opts.maxPages ?? 5;
  let imported = 0, skipped = 0, scanned = 0;
  // The official registry paginates by opaque cursor (metadata.nextCursor), NOT
  // by offset — an offset param is ignored and returns the same first page.
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetchRegistryPage(`${OFFICIAL_REGISTRY}?${qs.toString()}`);
    if (!res || !res.ok) break; // slow/unreachable page: stop, keep prior progress
    const body = (await res.json()) as { servers?: unknown; metadata?: { nextCursor?: string } };
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
    cursor = body.metadata?.nextCursor;
    if (!cursor || rawList.length < limit) break;
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

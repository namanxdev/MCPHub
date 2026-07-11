// lib/security/store.ts
import { db } from "../db/index.js";
import { servers, serverScans, toolBaselines } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import type { ScanResult, ToolFingerprint } from "./types.js";

/** Load the stored baseline for a target as a name->hash map. */
export async function loadBaseline(target: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ toolName: toolBaselines.toolName, hash: toolBaselines.hash })
    .from(toolBaselines)
    .where(eq(toolBaselines.target, target));
  return new Map(rows.map((r) => [r.toolName, r.hash]));
}

/** Upsert the current fingerprints as the new baseline for a target. */
export async function saveBaseline(target: string, fps: ToolFingerprint[]): Promise<void> {
  for (const fp of fps) {
    const existing = await db
      .select({ id: toolBaselines.id })
      .from(toolBaselines)
      .where(and(eq(toolBaselines.target, target), eq(toolBaselines.toolName, fp.name)))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(toolBaselines)
        .set({ hash: fp.hash, updatedAt: new Date() })
        .where(eq(toolBaselines.id, existing[0].id));
    } else {
      await db.insert(toolBaselines).values({ target, toolName: fp.name, hash: fp.hash });
    }
  }
}

/** Persist a scan result to history. */
export async function saveScan(result: ScanResult): Promise<void> {
  await db.insert(serverScans).values({
    serverId: result.serverId,
    target: result.target,
    score: result.score,
    grade: result.grade,
    toolsCount: result.tools.length,
    findings: result.findings,
  });
}

/** List hosted streamable-http servers eligible for batch scanning. */
export async function listScannableServers(): Promise<{ id: string; name: string; url: string }[]> {
  const rows = await db
    .select({ id: servers.id, name: servers.name, url: servers.url, transportType: servers.transportType, status: servers.status })
    .from(servers)
    .where(eq(servers.status, "active"));
  return rows
    .filter((r) => r.url && r.transportType === "streamable-http")
    .map((r) => ({ id: r.id, name: r.name, url: r.url as string }))
    .sort((a, b) => a.url.localeCompare(b.url));
}

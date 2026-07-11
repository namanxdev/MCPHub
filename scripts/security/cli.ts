// scripts/security/cli.ts
// Dependency-free CLI: plain process.argv parsing, no commander/picocolors.
// Mirrors the loadEnv() pattern from scripts/seed-registry.ts.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
    }
  }
}
loadEnv();

function printUsage() {
  console.log(`
MCPHub Security Scan — passive, read-only MCP auditor

Usage:
  tsx scripts/security/cli.ts scan <url> [--md <path>] [--no-persist]
  tsx scripts/security/cli.ts scan --registry <id> [--md <path>] [--no-persist]
  tsx scripts/security/cli.ts scan --batch [--md <path>]
  tsx scripts/security/cli.ts registry seed [--pages <n>]

Options:
  scan <url>           Scan an MCP server by URL (ad-hoc; no DB required)
  scan --registry <id> Scan a registry server by its UUID; persists by default
  scan --batch         Scan all registered streamable-http servers; emits leaderboard
  registry seed        Seed Postgres from the official MCP registry API
  --md <path>          Write the markdown report/leaderboard to a file
  --no-persist         Skip DB reads/writes (ad-hoc URL scans only)
  --pages <n>          Max pages of 100 to import (default: 5)
  --help, -h           Show this help message
`.trim());
}

/** Parse a flat argv array for a named option value: --key value */
function getOpt(args: string[], key: string): string | undefined {
  const idx = args.indexOf(key);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

/** Check if a flag is present. */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some((f) => args.includes(f));
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || hasFlag(argv, "--help", "-h")) {
    printUsage();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const [command, ...rest] = argv;

  // ── registry seed ────────────────────────────────────────────────────────────
  if (command === "registry") {
    const sub = rest[0];
    if (sub !== "seed") {
      console.error(`Unknown registry subcommand: ${sub ?? "(none)"}`);
      printUsage();
      process.exit(1);
    }
    const pagesArg = getOpt(rest, "--pages");
    const pagesInt = pagesArg ? parseInt(pagesArg, 10) : 5;
    const { seedRegistryFromOfficial } = await import("../../lib/security/index.js");
    const res = await seedRegistryFromOfficial({ maxPages: pagesInt });
    console.log(`Imported ${res.imported}, skipped ${res.skipped}, scanned ${res.scanned} registry entries.`);
    return;
  }

  // ── scan ─────────────────────────────────────────────────────────────────────
  if (command === "scan") {
    const { runScan, runBatch, renderReport, renderLeaderboard, listScannableServers } =
      await import("../../lib/security/index.js");

    const mdPath = getOpt(rest, "--md");
    const noPersist = hasFlag(rest, "--no-persist");
    const isBatch = hasFlag(rest, "--batch");
    const registryId = getOpt(rest, "--registry");

    // ── scan --batch ──────────────────────────────────────────────────────────
    if (isBatch) {
      const targets = await listScannableServers();
      const rows = await runBatch(targets);
      const md = renderLeaderboard(rows.map((r) => ({ target: r.name, grade: r.grade, score: r.score })));
      console.log(md);
      const outPath = mdPath ?? "SCAN-RESULTS.md";
      writeFileSync(outPath, md);
      console.error(`Leaderboard → ${outPath} (${rows.length} servers)`);
      return;
    }

    // ── scan --registry <id> ──────────────────────────────────────────────────
    if (registryId !== undefined) {
      const { db } = await import("../../lib/db/index.js");
      const { servers } = await import("../../lib/db/schema.js");
      const { eq } = await import("drizzle-orm");
      const rows = await db
        .select({ id: servers.id, url: servers.url })
        .from(servers)
        .where(eq(servers.id, registryId))
        .limit(1);
      const row = rows[0];
      if (!row?.url) {
        console.error(`Registry server ${registryId} not found or has no URL.`);
        process.exit(1);
      }
      // Registry scans persist unless explicitly suppressed.
      const persist = noPersist ? false : true;
      const result = await runScan(row.url, { serverId: row.id, persist });
      console.log(JSON.stringify(result, null, 2));
      if (mdPath) {
        writeFileSync(mdPath, renderReport(result));
        console.error(`Report → ${mdPath}`);
      }
      return;
    }

    // ── scan <url> ────────────────────────────────────────────────────────────
    // Find the positional URL argument (first arg that doesn't start with --)
    const urlArg = rest.find((a) => !a.startsWith("-"));
    if (!urlArg) {
      console.error("Provide a <url>, --registry <id>, or --batch");
      printUsage();
      process.exit(1);
    }
    // Ad-hoc URL scans NEVER persist (no DB needed), regardless of --no-persist flag.
    const persist = false;
    const result = await runScan(urlArg, { serverId: null, persist });
    console.log(JSON.stringify(result, null, 2));
    if (mdPath) {
      writeFileSync(mdPath, renderReport(result));
      console.error(`Report → ${mdPath}`);
    }
    return;
  }

  // ── unknown command ───────────────────────────────────────────────────────────
  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

main().catch((e) => {
  console.error("Scan CLI failed:", e);
  process.exit(1);
});

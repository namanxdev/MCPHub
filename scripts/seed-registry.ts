/**
 * MCPHub Registry Seed Script
 * Seeds the database with well-known MCP servers.
 *
 * Usage: npx tsx scripts/seed-registry.ts
 * Requires: DATABASE_URL environment variable
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

// Load .env file
function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const envPath = resolve(process.cwd(), name);
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}
loadEnv();

const SEED_SERVERS = [
  {
    name: "Everything",
    slug: "everything",
    url: "https://everything.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Reference MCP server with sample tools, resources, and prompts for testing",
    longDescription:
      "The official MCP reference server that exposes sample tools, resources, and prompts. Perfect for testing MCP clients and understanding the protocol.",
    authorName: "Anthropic",
    authorUrl: "https://github.com/modelcontextprotocol",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["development", "testing"],
    tags: ["reference", "sample", "testing"],
  },
  {
    name: "GitHub",
    slug: "github",
    url: "https://github.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Access GitHub repositories, issues, pull requests, and more",
    authorName: "GitHub",
    authorUrl: "https://github.com",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["development", "productivity"],
    tags: ["github", "git", "code"],
  },
  {
    name: "Filesystem",
    slug: "filesystem",
    url: "https://filesystem.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Secure file system access with configurable permissions",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["development", "utilities"],
    tags: ["files", "filesystem", "io"],
  },
  {
    name: "PostgreSQL",
    slug: "postgresql",
    url: "https://postgres.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Query and manage PostgreSQL databases with read-only safety",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["databases"],
    tags: ["postgres", "sql", "database"],
  },
  {
    name: "SQLite",
    slug: "sqlite",
    url: "https://sqlite.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Interact with SQLite databases for analytics and data exploration",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["databases"],
    tags: ["sqlite", "sql", "database"],
  },
  {
    name: "Brave Search",
    slug: "brave-search",
    url: "https://brave-search.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Web and local search using the Brave Search API",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["search", "web"],
    tags: ["search", "brave", "web"],
  },
  {
    name: "Google Maps",
    slug: "google-maps",
    url: "https://google-maps.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Location services, directions, and place details via Google Maps",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["web", "utilities"],
    tags: ["maps", "location", "google"],
  },
  {
    name: "Slack",
    slug: "slack",
    url: "https://slack.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Read and manage Slack channels, messages, and users",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["communication", "productivity"],
    tags: ["slack", "messaging", "chat"],
  },
  {
    name: "Memory",
    slug: "memory",
    url: "https://memory.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Knowledge graph-based persistent memory for AI conversations",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["ai", "utilities"],
    tags: ["memory", "knowledge-graph", "persistence"],
  },
  {
    name: "Puppeteer",
    slug: "puppeteer",
    url: "https://puppeteer.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Browser automation and web scraping with Puppeteer",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["web", "automation"],
    tags: ["browser", "scraping", "puppeteer"],
  },
  {
    name: "Fetch",
    slug: "fetch",
    url: "https://fetch.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Fetch and convert web content to markdown for easy consumption",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["web", "utilities"],
    tags: ["fetch", "http", "markdown"],
  },
  {
    name: "Git",
    slug: "git",
    url: "https://git.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Git repository operations — clone, diff, log, commit, and more",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["development"],
    tags: ["git", "version-control", "code"],
  },
  {
    name: "Google Drive",
    slug: "google-drive",
    url: "https://gdrive.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Search and access files in Google Drive",
    authorName: "Anthropic",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["productivity", "cloud"],
    tags: ["google-drive", "files", "cloud"],
  },
  {
    name: "Sentry",
    slug: "sentry",
    url: "https://sentry.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Access Sentry error tracking data and issue management",
    authorName: "Sentry",
    authorUrl: "https://sentry.io",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    categories: ["development", "monitoring"],
    tags: ["sentry", "errors", "monitoring"],
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    url: "https://cloudflare.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Manage Cloudflare Workers, KV, R2, and D1 resources",
    authorName: "Cloudflare",
    authorUrl: "https://cloudflare.com",
    categories: ["cloud", "development"],
    tags: ["cloudflare", "workers", "edge"],
  },
  {
    name: "Linear",
    slug: "linear",
    url: "https://linear.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Project management with Linear — issues, projects, and teams",
    authorName: "Linear",
    authorUrl: "https://linear.app",
    categories: ["productivity", "development"],
    tags: ["linear", "project-management", "issues"],
  },
  {
    name: "Stripe",
    slug: "stripe",
    url: "https://stripe.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Interact with Stripe payments, customers, and subscriptions",
    authorName: "Stripe",
    authorUrl: "https://stripe.com",
    categories: ["finance", "web"],
    tags: ["stripe", "payments", "billing"],
  },
  {
    name: "Notion",
    slug: "notion",
    url: "https://notion.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Search, read, and create Notion pages, databases, and comments",
    authorName: "Notion",
    authorUrl: "https://notion.so",
    categories: ["productivity"],
    tags: ["notion", "notes", "wiki"],
  },
  {
    name: "Spotify",
    slug: "spotify",
    url: "https://spotify.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Control Spotify playback, search music, and manage playlists",
    authorName: "Community",
    categories: ["media", "entertainment"],
    tags: ["spotify", "music", "playback"],
  },
  {
    name: "Docker",
    slug: "docker",
    url: "https://docker.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Manage Docker containers, images, volumes, and networks",
    authorName: "Community",
    categories: ["development", "devops"],
    tags: ["docker", "containers", "devops"],
  },
  {
    name: "AWS",
    slug: "aws",
    url: "https://aws.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Interact with AWS services — S3, EC2, Lambda, and more",
    authorName: "Community",
    categories: ["cloud", "devops"],
    tags: ["aws", "cloud", "infrastructure"],
  },
  {
    name: "Figma",
    slug: "figma",
    url: "https://figma.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Access Figma designs, components, and design tokens",
    authorName: "Community",
    categories: ["design"],
    tags: ["figma", "design", "ui"],
  },
  {
    name: "Todoist",
    slug: "todoist",
    url: "https://todoist.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Manage tasks, projects, and labels in Todoist",
    authorName: "Community",
    categories: ["productivity"],
    tags: ["todoist", "tasks", "todo"],
  },
  {
    name: "YouTube",
    slug: "youtube",
    url: "https://youtube.mcp.run/sse",
    transportType: "sse",
    shortDescription:
      "Search YouTube videos, get transcripts, and channel info",
    authorName: "Community",
    categories: ["media", "search"],
    tags: ["youtube", "video", "transcripts"],
  },
  {
    name: "Exa",
    slug: "exa",
    url: "https://exa.mcp.run/sse",
    transportType: "sse",
    shortDescription: "Neural search engine for finding relevant web content",
    authorName: "Exa",
    authorUrl: "https://exa.ai",
    categories: ["search", "ai"],
    tags: ["exa", "search", "neural"],
  },
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url || url === "postgresql://...") {
    console.error("Error: DATABASE_URL is not set or is a placeholder.");
    console.error(
      "Set DATABASE_URL in your environment or .env.local file."
    );
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  console.log(`Seeding ${SEED_SERVERS.length} servers...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const server of SEED_SERVERS) {
    try {
      // Check if slug already exists
      const existing = await db
        .select({ id: schema.servers.id })
        .from(schema.servers)
        .where(eq(schema.servers.slug, server.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  Skipped: ${server.name} (already exists)`);
        skipped++;
        continue;
      }

      await db.insert(schema.servers).values({
        name: server.name,
        slug: server.slug,
        url: server.url,
        transportType: server.transportType,
        shortDescription: server.shortDescription,
        longDescription: server.longDescription ?? null,
        authorName: server.authorName,
        authorUrl: server.authorUrl ?? null,
        repoUrl: server.repoUrl ?? null,
        categories: server.categories,
        tags: server.tags ?? [],
        status: "active",
        isFeatured: false,
        toolsCount: 0,
        resourcesCount: 0,
        promptsCount: 0,
      });

      console.log(`  Inserted: ${server.name}`);
      inserted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // If it's a unique constraint violation, just skip
      if (msg.includes("unique") || msg.includes("duplicate")) {
        console.log(`  Skipped: ${server.name} (duplicate URL)`);
        skipped++;
      } else {
        console.error(`  Error inserting ${server.name}: ${msg}`);
      }
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

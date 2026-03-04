import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  servers,
  serverTools,
  serverResources,
  serverPrompts,
  serverHealthChecks,
} from "@/lib/db/schema";
import { serverSubmissionSchema } from "@/lib/validators";
import { generateSlug } from "@/lib/utils/index";
import { eq, and, or, ilike, desc, asc, sql } from "drizzle-orm";

// ─── Simple in-memory rate limiter (5 requests per 10 minutes per IP) ─────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const limit = 5;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count += 1;
  return false;
}

// ─── GET /api/registry ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || "active";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  try {
    const whereClause = and(
      eq(servers.status, status),
      q
        ? or(
            ilike(servers.name, `%${q}%`),
            ilike(servers.shortDescription, `%${q}%`)
          )
        : undefined,
      category
        ? sql`${sql.raw(`'${category.replace(/'/g, "''")}'`)} = ANY(${servers.categories})`
        : undefined
    );

    const orderBy =
      sort === "name"
        ? asc(servers.name)
        : sort === "tools"
        ? desc(servers.toolsCount)
        : desc(servers.createdAt);

    const results = await db
      .select()
      .from(servers)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(servers)
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      servers: results,
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error("Registry GET error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// ─── POST /api/registry ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = serverSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    url,
    name,
    shortDescription,
    longDescription,
    categories,
    tags,
    authorName,
    authorUrl,
    repoUrl,
    transportType,
  } = parsed.data;

  try {
    // Check for duplicate URL
    const existing = await db
      .select({ id: servers.id })
      .from(servers)
      .where(eq(servers.url, url))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Server URL already registered" },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(name);
    const slugConflicts = await db
      .select({ slug: servers.slug })
      .from(servers)
      .where(ilike(servers.slug, `${slug}%`));

    if (slugConflicts.length > 0) {
      const existingSlugs = new Set(slugConflicts.map((r) => r.slug));
      if (existingSlugs.has(slug)) {
        let i = 2;
        while (existingSlugs.has(`${slug}-${i}`)) i++;
        slug = `${slug}-${i}`;
      }
    }

    // Try to connect to the server via MCP with 15s timeout
    let status = "pending";
    const toolsList: Array<{
      name: string;
      description?: string;
      inputSchema?: unknown;
    }> = [];
    const resourcesList: Array<{
      uri: string;
      name?: string;
      description?: string;
      mimeType?: string;
    }> = [];
    const promptsList: Array<{
      name: string;
      description?: string;
      arguments?: unknown;
    }> = [];
    let connectionLatencyMs: number | undefined;

    try {
      const { Client } = await import(
        "@modelcontextprotocol/sdk/client/index.js"
      );
      const { SSEClientTransport } = await import(
        "@modelcontextprotocol/sdk/client/sse.js"
      );
      const { StreamableHTTPClientTransport } = await import(
        "@modelcontextprotocol/sdk/client/streamableHttp.js"
      );

      const startTime = Date.now();
      const parsedUrl = new URL(url);
      const transport =
        transportType === "sse"
          ? new SSEClientTransport(parsedUrl)
          : new StreamableHTTPClientTransport(parsedUrl);

      const client = new Client(
        { name: "mcphub-registry", version: "1.0.0" },
        { capabilities: {} }
      );

      await Promise.race([
        client.connect(transport),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 15000)
        ),
      ]);

      connectionLatencyMs = Date.now() - startTime;

      const [toolsResult, resourcesResult, promptsResult] =
        await Promise.allSettled([
          client.listTools(),
          client.listResources(),
          client.listPrompts(),
        ]);

      if (toolsResult.status === "fulfilled") {
        toolsList.push(...toolsResult.value.tools);
      }
      if (resourcesResult.status === "fulfilled") {
        resourcesList.push(...resourcesResult.value.resources);
      }
      if (promptsResult.status === "fulfilled") {
        promptsList.push(...promptsResult.value.prompts);
      }

      await client.close();
      status = "active";
    } catch (e) {
      console.error("Server validation failed during submission:", e);
      status = "pending";
    }

    // Create server record
    const [server] = await db
      .insert(servers)
      .values({
        name,
        slug,
        url,
        transportType,
        shortDescription,
        longDescription: longDescription ?? null,
        authorName,
        authorUrl: authorUrl ?? null,
        repoUrl: repoUrl ?? null,
        categories,
        tags: tags ?? [],
        status,
        toolsCount: toolsList.length,
        resourcesCount: resourcesList.length,
        promptsCount: promptsList.length,
      })
      .returning();

    // Store tools
    if (toolsList.length > 0) {
      await db.insert(serverTools).values(
        toolsList.map((t) => ({
          serverId: server.id,
          toolName: t.name,
          description: t.description ?? null,
          inputSchema: t.inputSchema ?? null,
        }))
      );
    }

    // Store resources
    if (resourcesList.length > 0) {
      await db.insert(serverResources).values(
        resourcesList.map((r) => ({
          serverId: server.id,
          uri: r.uri,
          name: r.name ?? null,
          description: r.description ?? null,
          mimeType: r.mimeType ?? null,
        }))
      );
    }

    // Store prompts
    if (promptsList.length > 0) {
      await db.insert(serverPrompts).values(
        promptsList.map((p) => ({
          serverId: server.id,
          promptName: p.name,
          description: p.description ?? null,
          arguments: p.arguments ?? null,
        }))
      );
    }

    // Store initial health check
    await db.insert(serverHealthChecks).values({
      serverId: server.id,
      isReachable: status === "active",
      latencyMs: connectionLatencyMs ?? null,
      toolsCount: toolsList.length,
      errorMessage:
        status === "pending" ? "Initial connection failed" : undefined,
    });

    return NextResponse.json(
      {
        server,
        status: status === "active" ? "approved" : "pending",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registry POST error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

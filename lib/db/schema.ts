import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Registry: Servers ───────────────────────────────────────────────────────

export const servers = pgTable(
  "servers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    url: text("url").notNull().unique(),
    transportType: text("transport_type").notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description"),
    authorName: text("author_name").notNull(),
    authorUrl: text("author_url"),
    repoUrl: text("repo_url"),
    categories: text("categories").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    status: text("status").notNull().default("active"),
    isFeatured: boolean("is_featured").notNull().default(false),
    toolsCount: integer("tools_count").notNull().default(0),
    resourcesCount: integer("resources_count").notNull().default(0),
    promptsCount: integer("prompts_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIdx: index("idx_servers_status").on(table.status),
    slugIdx: index("idx_servers_slug").on(table.slug),
  })
);

export const serverTools = pgTable(
  "server_tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    description: text("description"),
    inputSchema: jsonb("input_schema"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    serverIdx: index("idx_server_tools_server").on(table.serverId),
  })
);

export const serverResources = pgTable(
  "server_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    uri: text("uri").notNull(),
    name: text("name"),
    description: text("description"),
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    serverIdx: index("idx_server_resources_server").on(table.serverId),
  })
);

export const serverPrompts = pgTable(
  "server_prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    promptName: text("prompt_name").notNull(),
    description: text("description"),
    arguments: jsonb("arguments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    serverIdx: index("idx_server_prompts_server").on(table.serverId),
  })
);

// ─── Health & Metrics ─────────────────────────────────────────────────────────

export const serverMetrics = pgTable(
  "server_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: uuid("server_id").references(() => servers.id),
    serverUrl: text("server_url").notNull(),
    toolName: text("tool_name").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    responseBytes: integer("response_bytes").notNull(),
    isError: boolean("is_error").notNull().default(false),
    errorType: text("error_type"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    serverTimeIdx: index("idx_metrics_server_time").on(
      table.serverId,
      table.createdAt
    ),
    serverToolIdx: index("idx_metrics_server_tool").on(
      table.serverId,
      table.toolName
    ),
  })
);

export const serverHealthChecks = pgTable(
  "server_health_checks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serverId: uuid("server_id").references(() => servers.id),
    isReachable: boolean("is_reachable").notNull(),
    latencyMs: integer("latency_ms"),
    toolsCount: integer("tools_count"),
    errorMessage: text("error_message"),
    checkedAt: timestamp("checked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    serverIdx: index("idx_health_checks_server").on(
      table.serverId,
      table.checkedAt
    ),
  })
);

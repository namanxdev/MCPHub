import { z } from "zod";

// ─── Connect Request (discriminated union on transport) ─────────────────────

const httpConnectSchema = z.object({
  transport: z.enum(["sse", "streamable-http"]),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

const stdioConnectSchema = z.object({
  transport: z.literal("stdio"),
  command: z.string().min(1).max(500),
  env: z.record(z.string(), z.string()).optional(),
});

export const connectRequestSchema = z.discriminatedUnion("transport", [
  httpConnectSchema,
  stdioConnectSchema,
]);

export type ConnectRequest = z.infer<typeof connectRequestSchema>;

// ─── Tool Call ──────────────────────────────────────────────────────────────

export const toolCallRequestSchema = z.object({
  sessionId: z.string().uuid(),
  toolName: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

// ─── Server Submission ──────────────────────────────────────────────────────

export const serverSubmissionSchema = z
  .object({
    url: z.string().url().optional(),
    name: z.string().min(1).max(100),
    shortDescription: z.string().min(1).max(280),
    longDescription: z.string().max(5000).optional(),
    categories: z.array(z.string()).min(1),
    tags: z.array(z.string()).optional().default([]),
    authorName: z.string().min(1),
    authorUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    transportType: z.enum(["sse", "streamable-http", "stdio"]),
    connectionGuide: z.string().max(2000).optional(),
    serverType: z.enum(["hosted", "local"]).default("hosted"),
    command: z.string().max(500).optional(),
    requiredEnvVars: z.array(z.string()).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.serverType === "hosted" && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL is required for hosted servers",
        path: ["url"],
      });
    }
    if (data.serverType === "local" && !data.command) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Command is required for local servers",
        path: ["command"],
      });
    }
  });

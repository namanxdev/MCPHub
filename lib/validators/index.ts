import { z } from "zod";

export const connectRequestSchema = z.object({
  url: z.string().url(),
  transport: z.enum(["sse", "streamable-http"]).default("sse"),
  headers: z.record(z.string(), z.string()).optional(),
});

export const toolCallRequestSchema = z.object({
  sessionId: z.string().uuid(),
  toolName: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

export const serverSubmissionSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(100),
  shortDescription: z.string().min(1).max(280),
  longDescription: z.string().max(5000).optional(),
  categories: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional().default([]),
  authorName: z.string().min(1),
  authorUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  transportType: z.enum(["sse", "streamable-http"]),
});

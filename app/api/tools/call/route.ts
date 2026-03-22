import { NextRequest, NextResponse } from "next/server";
import { connectionManager } from "@/lib/mcp/connection-manager";
import { toolCallRequestSchema } from "@/lib/validators";
import { recordToolCall } from "@/lib/mcp/health-collector";
import { toolCallLimiter, getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { sanitizeErrorMessage } from "@/lib/utils/sanitize-error";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(toolCallLimiter, getClientIp(req));
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  const userId = session?.user?.id;

  let serverUrl: string | undefined;
  let toolName: string | undefined;
  let startTime: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const body = await req.json();
    const parsed = toolCallRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, toolName: parsedToolName, arguments: args } = parsed.data;
    toolName = parsedToolName;

    const connection = userId
      ? connectionManager.getConnectionForUser(sessionId, userId)
      : connectionManager.getConnection(sessionId);
    if (!connection) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    serverUrl = connection.url ?? `stdio://${connection.command ?? "unknown"}`;
    const { client } = connection;
    startTime = Date.now();

    // Execute with 60s timeout
    const callPromise = client.callTool({ name: toolName, arguments: args });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Tool execution timed out after 60 seconds")),
        60000
      );
    });

    const result = await Promise.race([callPromise, timeoutPromise]);
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const responseBytes = new TextEncoder().encode(JSON.stringify(result)).length;

    // Record metrics asynchronously — don't await to avoid slowing response
    void recordToolCall({
      serverUrl,
      toolName,
      latencyMs,
      responseBytes,
      isError: false,
    });

    return NextResponse.json({
      result,
      meta: {
        latencyMs,
        responseBytes,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Record the failed call if we know the server and tool
    if (serverUrl && toolName && startTime !== undefined) {
      void recordToolCall({
        serverUrl,
        toolName,
        latencyMs: Date.now() - startTime,
        responseBytes: 0,
        isError: true,
        errorType: error instanceof Error ? error.constructor.name : "UnknownError",
        errorMessage: message,
      });
    }

    if (message.includes("timed out")) {
      return NextResponse.json({ error: message }, { status: 408 });
    }
    if (message.includes("Session not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: sanitizeErrorMessage(error) }, { status: 500 });
  }
}

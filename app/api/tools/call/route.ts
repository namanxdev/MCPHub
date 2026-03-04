import { NextRequest, NextResponse } from "next/server";
import { connectionManager } from "@/lib/mcp/connection-manager";
import { toolCallRequestSchema } from "@/lib/validators";
import { recordToolCall } from "@/lib/mcp/health-collector";

export async function POST(req: NextRequest) {
  let serverUrl: string | undefined;
  let toolName: string | undefined;
  let startTime: number | undefined;

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

    const connection = connectionManager.getConnection(sessionId);
    if (!connection) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    serverUrl = connection.url;
    const { client } = connection;
    startTime = Date.now();

    // Execute with 60s timeout
    const callPromise = client.callTool({ name: toolName, arguments: args });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Tool execution timed out after 60 seconds")),
        60000
      )
    );

    const result = await Promise.race([callPromise, timeoutPromise]);
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

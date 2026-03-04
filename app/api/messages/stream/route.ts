import { NextRequest } from "next/server";
import { connectionManager } from "@/lib/mcp/connection-manager";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("sessionId query param required", { status: 400 });
  }

  const logger = connectionManager.getLogger(sessionId);
  if (!logger) {
    return new Response("Session not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send existing messages
      const existing = logger.getMessages();
      for (const msg of existing) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
      }

      // Subscribe to new messages
      const unsubscribe = logger.subscribe((msg) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      });

      // Keepalive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(pingInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

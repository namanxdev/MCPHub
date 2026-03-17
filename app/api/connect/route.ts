import dns from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import { connectionManager } from "@/lib/mcp/connection-manager";
import { connectRequestSchema } from "@/lib/validators";
import { isPrivateIp, isLocalhostUrl } from "@/lib/utils/index";
import { connectLimiter, getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { sanitizeErrorMessage } from "@/lib/utils/sanitize-error";

export async function POST(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(connectLimiter, getClientIp(req));
  if (rateLimitResponse) return rateLimitResponse;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const body = await req.json();
    const parsed = connectRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Connection timed out after 15 seconds.")),
        15000
      );
    });

    let sessionId: string;
    let serverInfo: { name: string; version: string; protocolVersion: string };
    let client: Awaited<ReturnType<typeof connectionManager.connect>>["client"];

    if (parsed.data.transport === "stdio") {
      const { command, env } = parsed.data;

      const result = await Promise.race([
        connectionManager.connectStdio(command, env),
        timeoutPromise,
      ]);
      sessionId = result.sessionId;
      serverInfo = result.serverInfo;
      client = result.client;
    } else {
      const { url, transport, headers } = parsed.data;

      // SSRF protection
      try {
        const parsedUrl = new URL(url);
        if (
          (parsedUrl.protocol !== "https:" && !isLocalhostUrl(url)) ||
          (!isLocalhostUrl(url) && isPrivateIp(parsedUrl.hostname))
        ) {
          return NextResponse.json(
            {
              error:
                "Connections to private/internal IP addresses are not allowed.",
            },
            { status: 403 }
          );
        }

        // DNS rebinding protection: resolve the hostname and verify the
        // resulting IP is also not private. Skip for localhost URLs which
        // are intentionally allowed for local development.
        if (!isLocalhostUrl(url)) {
          const { address } = await dns.promises.lookup(parsedUrl.hostname);
          if (isPrivateIp(address)) {
            return NextResponse.json(
              {
                error:
                  "Connections to private/internal IP addresses are not allowed.",
              },
              { status: 403 }
            );
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("ENOTFOUND") || msg.includes("EAI_")) {
          return NextResponse.json(
            { error: "Could not resolve hostname." },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }

      const result = await Promise.race([
        connectionManager.connect(url, transport, headers),
        timeoutPromise,
      ]);
      sessionId = result.sessionId;
      serverInfo = result.serverInfo;
      client = result.client;
    }
    clearTimeout(timeoutId);

    // Enumerate capabilities
    const [toolsResult, resourcesResult, promptsResult] =
      await Promise.allSettled([
        client.listTools(),
        client.listResources(),
        client.listPrompts(),
      ]);

    const tools =
      toolsResult.status === "fulfilled" ? toolsResult.value.tools : [];
    const resources =
      resourcesResult.status === "fulfilled"
        ? resourcesResult.value.resources
        : [];
    const prompts =
      promptsResult.status === "fulfilled" ? promptsResult.value.prompts : [];

    return NextResponse.json({
      sessionId,
      serverInfo,
      capabilities: { tools, resources, prompts },
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message.includes("timed out")) {
      return NextResponse.json({ error: message }, { status: 504 });
    }
    if (
      message.includes("ECONNREFUSED") ||
      message.includes("fetch failed")
    ) {
      return NextResponse.json(
        { error: `Server unreachable: ${message}` },
        { status: 502 }
      );
    }
    if (message.includes("ENOENT")) {
      return NextResponse.json(
        { error: "Command not found. Make sure it's installed and in your PATH." },
        { status: 400 }
      );
    }
    if (message.includes("spawn")) {
      return NextResponse.json(
        { error: `Failed to spawn process: ${message}` },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: sanitizeErrorMessage(error) }, { status: 500 });
  }
}

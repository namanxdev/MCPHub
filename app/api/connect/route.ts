import { NextRequest, NextResponse } from "next/server";
import { connectionManager } from "@/lib/mcp/connection-manager";
import { connectRequestSchema } from "@/lib/validators";
import { isPrivateIp, isLocalhostUrl } from "@/lib/utils/index";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = connectRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

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
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Connect with 15-second timeout
    const connectPromise = connectionManager.connect(url, transport, headers);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Connection timed out after 15 seconds.")),
        15000
      )
    );

    const { sessionId, serverInfo, client } = await Promise.race([
      connectPromise,
      timeoutPromise,
    ]);

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

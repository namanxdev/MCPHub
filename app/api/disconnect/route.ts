import { NextRequest, NextResponse } from "next/server";
import { connectionManager } from "@/lib/mcp/connection-manager";
import { z } from "zod";

const schema = z.object({ sessionId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
  }

  await connectionManager.disconnect(parsed.data.sessionId);
  return NextResponse.json({ success: true });
}

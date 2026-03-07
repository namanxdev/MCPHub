import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ServerDetail } from "@/components/registry/server-detail";
import { getDb } from "@/lib/db";
import {
  servers,
  serverTools,
  serverResources,
  serverPrompts,
  serverHealthChecks,
} from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";

interface RegistryServerPageProps {
  params: Promise<{ serverId: string }>;
}

async function getServerDetail(serverId: string) {
  try {
    const db = getDb();

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        serverId
      );
    const whereClause = isUuid
      ? or(eq(servers.id, serverId), eq(servers.slug, serverId))
      : eq(servers.slug, serverId);

    const serverResults = await db
      .select()
      .from(servers)
      .where(whereClause)
      .limit(1);

    if (serverResults.length === 0) return null;

    const server = serverResults[0];

    const [tools, resources, prompts, healthChecks] = await Promise.all([
      db
        .select()
        .from(serverTools)
        .where(eq(serverTools.serverId, server.id)),
      db
        .select()
        .from(serverResources)
        .where(eq(serverResources.serverId, server.id)),
      db
        .select()
        .from(serverPrompts)
        .where(eq(serverPrompts.serverId, server.id)),
      db
        .select()
        .from(serverHealthChecks)
        .where(eq(serverHealthChecks.serverId, server.id))
        .orderBy(desc(serverHealthChecks.checkedAt))
        .limit(10),
    ]);

    return {
      server,
      capabilities: { tools, resources, prompts },
      healthChecks,
    };
  } catch (error) {
    console.error("Failed to fetch server detail:", error);
    return null;
  }
}

export default async function RegistryServerPage({
  params,
}: RegistryServerPageProps) {
  const { serverId } = await params;
  const data = await getServerDetail(serverId);

  if (!data) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/registry"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to Registry
      </Link>
      <ServerDetail
        server={data.server}
        capabilities={data.capabilities}
        healthChecks={data.healthChecks}
      />
    </div>
  );
}

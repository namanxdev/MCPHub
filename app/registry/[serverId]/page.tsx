import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ServerDetail } from "@/components/registry/server-detail";

interface RegistryServerPageProps {
  params: Promise<{ serverId: string }>;
}

async function getServerDetail(serverId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/registry/${serverId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch server");
  return res.json();
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

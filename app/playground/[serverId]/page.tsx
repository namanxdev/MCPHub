"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2Icon, ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerSummary {
  id: string;
  slug: string;
  name: string;
  url: string;
  transportType: string;
  shortDescription: string;
  authorName: string;
}

interface PlaygroundServerPageProps {
  params: Promise<{ serverId: string }>;
}

export default function PlaygroundServerPage({
  params,
}: PlaygroundServerPageProps) {
  const router = useRouter();
  const [server, setServer] = useState<ServerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { serverId } = await params;
      try {
        const res = await fetch(`/api/registry/${serverId}`);
        if (!res.ok) {
          setError("Server not found in registry.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setServer(data.server);
      } catch {
        if (!cancelled) setError("Failed to load server details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [params]);

  function handleConnect() {
    if (!server) return;
    const qs = new URLSearchParams({
      url: server.url,
      transport: server.transportType,
    }).toString();
    router.push(`/playground?${qs}`);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2Icon className="size-8 animate-spin" />
        <p className="text-sm">Loading server details...</p>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">{error ?? "Server not found."}</p>
        <Button variant="outline" asChild>
          <Link href="/registry">
            <ArrowLeftIcon className="size-4" />
            Back to Registry
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col gap-6">
      <Link
        href={`/registry/${server.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to Listing
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{server.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            by {server.authorName}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {server.shortDescription}
          </p>
          <div className="rounded-md border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">Server URL</p>
            <p className="font-mono text-sm break-all">{server.url}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleConnect} className="flex-1">
              <ExternalLinkIcon className="size-4" />
              Open in Playground
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/registry/${server.slug}`}>View Details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

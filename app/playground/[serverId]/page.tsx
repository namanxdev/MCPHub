"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2Icon, ArrowLeftIcon, ExternalLinkIcon, TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerSummary {
  id: string;
  slug: string;
  name: string;
  url: string | null;
  transportType: string;
  serverType?: string;
  command?: string | null;
  requiredEnvVars?: string[];
  shortDescription: string;
  authorName: string;
  connectionGuide: string | null;
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

    const isLocal = server.serverType === "local";

    if (isLocal && server.command) {
      const qs = new URLSearchParams({
        transport: "stdio",
        command: server.command,
      });
      if (server.requiredEnvVars && server.requiredEnvVars.length > 0) {
        qs.set("requiredEnvVars", server.requiredEnvVars.join(","));
      }
      router.push(`/playground?${qs.toString()}`);
    } else if (server.url) {
      const qs = new URLSearchParams({
        url: server.url,
        transport: server.transportType,
      }).toString();
      router.push(`/playground?${qs}`);
    }
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

  const isLocal = server.serverType === "local";

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
          <div className="flex items-center gap-2">
            <CardTitle>{server.name}</CardTitle>
            {isLocal && (
              <Badge variant="outline" className="font-mono text-xs gap-1">
                <TerminalIcon className="size-3" />
                Local
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            by {server.authorName}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {server.shortDescription}
          </p>

          {isLocal && server.command ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">Command</p>
              <p className="font-mono text-sm break-all">{server.command}</p>
            </div>
          ) : server.url ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">Server URL</p>
              <p className="font-mono text-sm break-all">{server.url}</p>
            </div>
          ) : null}

          {isLocal && server.requiredEnvVars && server.requiredEnvVars.length > 0 && (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1.5">Required Environment Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {server.requiredEnvVars.map((v) => (
                  <Badge key={v} variant="secondary" className="font-mono text-xs">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {server.connectionGuide && (
            <div className="rounded-md border border-amber-500/30 bg-amber-50/5 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1.5">How to Connect</p>
              <pre className="font-mono text-xs whitespace-pre-wrap break-all text-foreground/80">
                {server.connectionGuide}
              </pre>
            </div>
          )}
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

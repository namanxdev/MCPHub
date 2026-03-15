"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PlayIcon,
  ClipboardCopyIcon,
  ExternalLinkIcon,
  CheckIcon,
  WrenchIcon,
  FileTextIcon,
  MessageSquareIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HealthBadge } from "@/components/registry/health-badge";

type HealthStatus = "healthy" | "degraded" | "unreachable" | "unknown";

interface HealthCheck {
  id: string;
  isReachable: boolean;
  latencyMs: number | null;
  toolsCount: number | null;
  errorMessage: string | null;
  checkedAt: string | Date;
}

interface ServerTool {
  id: string;
  toolName: string;
  description: string | null;
  inputSchema: unknown;
}

interface ServerResource {
  id: string;
  uri: string;
  name: string | null;
  description: string | null;
  mimeType: string | null;
}

interface ServerPrompt {
  id: string;
  promptName: string;
  description: string | null;
  arguments: unknown;
}

interface ServerData {
  id: string;
  slug: string;
  name: string;
  authorName: string;
  authorUrl: string | null;
  repoUrl: string | null;
  shortDescription: string;
  longDescription: string | null;
  connectionGuide: string | null;
  categories: string[];
  tags: string[];
  status: string;
  transportType: string;
  toolsCount: number;
  resourcesCount: number;
  promptsCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ServerDetailProps {
  server: ServerData;
  capabilities: {
    tools: ServerTool[];
    resources: ServerResource[];
    prompts: ServerPrompt[];
  };
  healthChecks: HealthCheck[];
}

function statusToHealth(status: string): HealthStatus {
  switch (status) {
    case "active":
      return "healthy";
    case "degraded":
      return "degraded";
    case "unreachable":
      return "unreachable";
    default:
      return "unknown";
  }
}

function computeMetrics(checks: HealthCheck[]) {
  if (checks.length === 0) return { avgLatencyMs: null, uptimePct: null };
  const reachable = checks.filter((c) => c.isReachable);
  const uptimePct = (reachable.length / checks.length) * 100;
  const latencies = reachable
    .map((c) => c.latencyMs)
    .filter((l): l is number => l !== null);
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;
  return { avgLatencyMs, uptimePct };
}

function HealthHistoryChart({ checks }: { checks: HealthCheck[] }) {
  const data = [...checks]
    .reverse()
    .slice(-14)
    .map((c) => ({
      date: new Date(c.checkedAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),
      latency: c.latencyMs ?? 0,
      reachable: c.isReachable,
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[140px] text-sm text-muted-foreground">
        No health data available yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={16}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis unit="ms" tick={{ fontSize: 10 }} width={48} />
        <Tooltip
          formatter={(value) => [`${value}ms`, "Latency"]}
          labelFormatter={(label) => `Check: ${label}`}
        />
        <Bar dataKey="latency" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.reachable ? "#22c55e" : "#ef4444"}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ServerDetail({
  server,
  capabilities,
  healthChecks,
}: ServerDetailProps) {
  const [copied, setCopied] = useState(false);
  const health = statusToHealth(server.status);
  const { avgLatencyMs, uptimePct } = computeMetrics(healthChecks);

  async function copyUrl() {
    await navigator.clipboard.writeText(server.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{server.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              {server.authorUrl ? (
                <a
                  href={server.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-foreground"
                >
                  {server.authorName}
                  <ExternalLinkIcon className="inline size-3 ml-0.5" />
                </a>
              ) : (
                <span className="text-foreground">{server.authorName}</span>
              )}
              {server.repoUrl && (
                <>
                  <span>·</span>
                  <a
                    href={server.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Repository
                    <ExternalLinkIcon className="inline size-3 ml-0.5" />
                  </a>
                </>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{server.shortDescription}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild>
              <Link href={`/playground/${server.slug}`}>
                <PlayIcon className="size-4" />
                Test in Playground
              </Link>
            </Button>
            <Button variant="outline" onClick={copyUrl}>
              {copied ? (
                <>
                  <CheckIcon className="size-4" /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopyIcon className="size-4" /> Copy URL
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Category + tag badges */}
        <div className="flex flex-wrap gap-1.5">
          {server.categories.map((cat) => (
            <Badge key={cat} variant="secondary">
              {cat}
            </Badge>
          ))}
          {server.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          <Badge variant="outline" className="font-mono text-xs">
            {server.transportType}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Added{" "}
          {new Date(server.createdAt).toLocaleDateString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Health overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-4 gap-2">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Status
            </p>
            <HealthBadge status={health} showLabel />
          </CardContent>
        </Card>
        <Card className="py-4 gap-2">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Avg Latency
            </p>
            <p className="text-sm font-semibold">
              {avgLatencyMs != null ? `${avgLatencyMs}ms` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4 gap-2">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Uptime
            </p>
            <p className="text-sm font-semibold">
              {uptimePct != null ? `${uptimePct.toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4 gap-2">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Checks
            </p>
            <p className="text-sm font-semibold">{healthChecks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Health history chart */}
      {healthChecks.length > 0 && (
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-sm">Health History</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <HealthHistoryChart checks={healthChecks} />
          </CardContent>
        </Card>
      )}

      {/* Long description */}
      {server.longDescription && (
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-sm">About</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
              {server.longDescription}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Connection guide */}
      {server.connectionGuide && (
        <Card className="gap-3 py-4 border-amber-500/30 bg-amber-50/5">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-sm">How to Connect</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <pre className="text-xs font-mono bg-muted rounded-md p-3 whitespace-pre-wrap break-all text-foreground/80">
              {server.connectionGuide}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Capabilities tabs */}
      <Tabs defaultValue="tools">
        <TabsList>
          <TabsTrigger value="tools">
            <WrenchIcon className="size-3.5" />
            Tools
            <span className="ml-1 text-xs bg-background/50 rounded px-1">
              {capabilities.tools.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FileTextIcon className="size-3.5" />
            Resources
            <span className="ml-1 text-xs bg-background/50 rounded px-1">
              {capabilities.resources.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <MessageSquareIcon className="size-3.5" />
            Prompts
            <span className="ml-1 text-xs bg-background/50 rounded px-1">
              {capabilities.prompts.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-4">
          <ScrollArea className="max-h-[500px]">
            <div className="flex flex-col gap-3 pr-2">
              {capabilities.tools.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tools available
                </p>
              ) : (
                capabilities.tools.map((tool) => (
                  <Card key={tool.id} className="gap-2 py-4">
                    <CardContent className="px-4">
                      <p className="font-mono text-sm font-semibold">
                        {tool.toolName}
                      </p>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <ScrollArea className="max-h-[500px]">
            <div className="flex flex-col gap-3 pr-2">
              {capabilities.resources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No resources available
                </p>
              ) : (
                capabilities.resources.map((resource) => (
                  <Card key={resource.id} className="gap-2 py-4">
                    <CardContent className="px-4">
                      <p className="font-mono text-sm font-semibold">
                        {resource.uri}
                      </p>
                      {resource.name && (
                        <p className="text-sm font-medium mt-0.5">
                          {resource.name}
                        </p>
                      )}
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {resource.description}
                        </p>
                      )}
                      {resource.mimeType && (
                        <Badge
                          variant="secondary"
                          className="text-xs mt-2"
                        >
                          {resource.mimeType}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="prompts" className="mt-4">
          <ScrollArea className="max-h-[500px]">
            <div className="flex flex-col gap-3 pr-2">
              {capabilities.prompts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No prompts available
                </p>
              ) : (
                capabilities.prompts.map((prompt) => (
                  <Card key={prompt.id} className="gap-2 py-4">
                    <CardContent className="px-4">
                      <p className="font-mono text-sm font-semibold">
                        {prompt.promptName}
                      </p>
                      {prompt.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {prompt.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

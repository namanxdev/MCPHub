"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WrenchIcon, ExternalLinkIcon, PlayIcon, TerminalIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthBadge } from "@/components/registry/health-badge";

type HealthStatus = "healthy" | "degraded" | "unreachable" | "unknown";

export interface ServerCardData {
  id: string;
  slug: string;
  name: string;
  authorName: string;
  shortDescription: string;
  categories: string[];
  tags: string[];
  status: string;
  serverType?: string;
  toolsCount: number;
  resourcesCount: number;
  promptsCount: number;
  createdAt: Date | string;
  avgLatencyMs?: number | null;
  uptimePct?: number | null;
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

interface ServerCardProps {
  server: ServerCardData;
}

export function ServerCard({ server }: ServerCardProps) {
  const isLocal = server.serverType === "local";
  const health = isLocal ? ("unknown" as HealthStatus) : statusToHealth(server.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className="gap-4 py-5 h-full flex flex-col transition-[border-color,shadow] duration-300 hover:border-white/20 hover:shadow-[0_8px_32px_oklch(0_0_0/0.4)]"
        data-cursor="pointer"
      >
        <CardHeader className="px-5 pb-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/registry/${server.slug}`}
                className="hover:underline"
              >
                <CardTitle className="text-base truncate">{server.name}</CardTitle>
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                by {server.authorName}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {isLocal ? (
                <Badge variant="outline" className="text-xs font-mono gap-1">
                  <TerminalIcon className="size-3" />
                  Local
                </Badge>
              ) : (
                <>
                  {health === "healthy" && (
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                  <HealthBadge status={health} showLabel />
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 flex flex-col gap-3 flex-1">
          <CardDescription className="line-clamp-2 text-sm">
            {server.shortDescription}
          </CardDescription>

          {/* Category + tag badges */}
          <div className="flex flex-wrap gap-1.5">
            {server.categories.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
            {server.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <WrenchIcon className="size-3" />
              {server.toolsCount} tool{server.toolsCount !== 1 ? "s" : ""}
            </span>
            {server.avgLatencyMs != null && (
              <span>{server.avgLatencyMs}ms avg</span>
            )}
            {server.uptimePct != null && (
              <span>{server.uptimePct.toFixed(0)}% uptime</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={`/playground/${server.slug}`}>
                <PlayIcon className="size-3.5" />
                Test in Playground
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/registry/${server.slug}`}>
                <ExternalLinkIcon className="size-3.5" />
                Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ServerCardSkeleton() {
  return (
    <div className="border border-white/[0.08] p-5 h-52 flex flex-col gap-4">
      <div className="shimmer h-4 w-2/3 rounded" />
      <div className="shimmer h-3 w-1/3 rounded" />
      <div className="shimmer h-8 w-full rounded flex-1" />
      <div className="flex gap-2">
        <div className="shimmer h-7 flex-1 rounded" />
        <div className="shimmer h-7 w-20 rounded" />
      </div>
    </div>
  );
}

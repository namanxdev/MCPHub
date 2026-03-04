import Link from "next/link";
import { WrenchIcon, ExternalLinkIcon, PlayIcon } from "lucide-react";
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
  const health = statusToHealth(server.status);

  return (
    <Card className="gap-4 py-5 h-full flex flex-col">
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
          <HealthBadge status={health} showLabel />
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
  );
}

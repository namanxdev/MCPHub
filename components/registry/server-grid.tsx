"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ServerCard, type ServerCardData } from "@/components/registry/server-card";
import { Button } from "@/components/ui/button";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ServerCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card py-5 px-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="h-4 w-16 bg-muted rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-20 bg-muted rounded-full" />
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-8 bg-muted rounded mt-auto" />
    </div>
  );
}

interface ServerGridProps {
  servers: ServerCardData[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function ServerGrid({
  servers,
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ServerGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No servers found
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeftIcon className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

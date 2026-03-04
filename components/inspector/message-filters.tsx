"use client";

import { useCallback, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInspectorStore } from "@/stores/inspector-store";
import { cn } from "@/lib/utils";

export function MessageFilters() {
  const directionFilter = useInspectorStore((s) => s.directionFilter);
  const statusFilter = useInspectorStore((s) => s.statusFilter);
  const searchQuery = useInspectorStore((s) => s.searchQuery);
  const minLatencyMs = useInspectorStore((s) => s.minLatencyMs);
  const setDirectionFilter = useInspectorStore((s) => s.setDirectionFilter);
  const setStatusFilter = useInspectorStore((s) => s.setStatusFilter);
  const setSearchQuery = useInspectorStore((s) => s.setSearchQuery);
  const setMinLatencyMs = useInspectorStore((s) => s.setMinLatencyMs);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(value);
      }, 200);
    },
    [setSearchQuery]
  );

  const handleLatencyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") {
        setMinLatencyMs(null);
      } else {
        const num = parseInt(raw, 10);
        if (!isNaN(num) && num >= 0) {
          setMinLatencyMs(num);
        }
      }
    },
    [setMinLatencyMs]
  );

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b shrink-0">
      {/* Direction filter */}
      <div className="flex items-center rounded-md border overflow-hidden shrink-0">
        {(["all", "sent", "received"] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => setDirectionFilter(dir)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium transition-colors",
              directionFilter === dir
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            {dir === "all" ? "All" : dir === "sent" ? "→ Sent" : "← Recv"}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center rounded-md border overflow-hidden shrink-0">
        {(["all", "success", "error"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            {status === "all" ? "All" : status === "success" ? "OK" : "Error"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-32">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search messages..."
          defaultValue={searchQuery}
          onChange={handleSearchChange}
          className="pl-8 h-7 text-xs"
        />
      </div>

      {/* Min latency */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Min latency
        </span>
        <Input
          type="number"
          min={0}
          placeholder="ms"
          defaultValue={minLatencyMs ?? ""}
          onChange={handleLatencyChange}
          className="h-7 w-16 text-xs"
        />
        <span className="text-xs text-muted-foreground">ms</span>
      </div>

      {/* Reset */}
      {(directionFilter !== "all" ||
        statusFilter !== "all" ||
        searchQuery !== "" ||
        minLatencyMs !== null) && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setDirectionFilter("all");
            setStatusFilter("all");
            setSearchQuery("");
            setMinLatencyMs(null);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConnectionStore } from "@/stores/connection-store";
import { usePlaygroundStore } from "@/stores/playground-store";
import { cn } from "@/lib/utils";

export function ToolSelector() {
  const [search, setSearch] = useState("");
  const tools = useConnectionStore((s) => s.session?.tools ?? []);
  const selectedToolName = usePlaygroundStore((s) => s.selectedToolName);
  const selectTool = usePlaygroundStore((s) => s.selectTool);

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-medium">Tools</span>
        <Badge variant="secondary">{tools.length}</Badge>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filter tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Tool list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 flex flex-col gap-0.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {search ? "No tools match your filter" : "No tools available"}
            </p>
          ) : (
            filtered.map((tool) => {
              const firstLine = tool.description?.split("\n")[0] ?? "";
              const isSelected = tool.name === selectedToolName;

              return (
                <button
                  key={tool.name}
                  type="button"
                  onClick={() => selectTool(tool.name)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-accent group",
                    isSelected && "bg-accent"
                  )}
                >
                  <p
                    className={cn(
                      "font-mono text-xs font-semibold truncate",
                      isSelected
                        ? "text-foreground"
                        : "text-foreground/80 group-hover:text-foreground"
                    )}
                  >
                    {tool.name}
                  </p>
                  {firstLine && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {firstLine}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

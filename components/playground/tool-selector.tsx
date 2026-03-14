"use client";

import { useState } from "react";
import { SearchIcon, BoxIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-col h-full bg-background overflow-hidden border-0 relative">
      {/* Search */}
      <div className="p-4 border-b border-foreground/5 shrink-0 bg-background/50 backdrop-blur-sm z-10 sticky top-0">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground/40 pointer-events-none" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[10px] sm:text-xs font-mono uppercase tracking-widest border border-foreground/10 bg-foreground/3 placeholder:text-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground transition-all rounded"
          />
        </div>
      </div>

      {/* Tool list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col py-2 px-3 gap-1">
          {filtered.length === 0 ? (
            <p className="text-xs font-mono uppercase tracking-widest text-foreground/40 text-center py-10">
              {search ? "No matches" : "Empty"}
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
                    "w-full text-left px-4 py-3 transition-all rounded-md flex flex-col gap-1.5 border group relative overflow-hidden",
                    isSelected 
                      ? "bg-foreground text-background border-foreground shadow-[0_4px_12px_rgba(0,0,0,0.1)] transform scale-[1.01]" 
                      : "bg-transparent hover:bg-foreground/5 text-foreground border-transparent hover:border-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <BoxIcon className={cn("size-3.5 shrink-0", isSelected ? "text-background/80" : "text-foreground/40")} />
                    <span
                      className={cn(
                        "font-mono text-xs sm:text-sm font-bold truncate tracking-tight uppercase flex-1 mt-0.5",
                      )}
                    >
                      {tool.name}
                    </span>
                  </div>
                  {firstLine && (
                    <p className={cn(
                      "text-[10px] sm:text-[11px] font-medium leading-snug line-clamp-2 pl-5.5",
                      isSelected ? "text-background/80" : "text-foreground/50"
                    )}>
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

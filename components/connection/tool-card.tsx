"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlaygroundStore } from "@/stores/playground-store";
import type { Tool } from "@/stores/connection-store";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const [showSchema, setShowSchema] = useState(false);
  const selectTool = usePlaygroundStore((s) => s.selectTool);

  const properties = tool.inputSchema?.properties as
    | Record<string, { type?: string; description?: string }>
    | undefined;
  const required = tool.inputSchema?.required as string[] | undefined;
  const paramNames = properties ? Object.keys(properties) : [];

  return (
    <div className="border-b-2 border-foreground/10 py-6 px-6 group hover:bg-foreground/5 transition-colors duration-300">
      <div className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-base font-bold uppercase tracking-tight text-foreground">
            {tool.name}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {tool.annotations?.readOnlyHint && (
              <Badge variant="outline" className="text-[10px] rounded-none border-foreground text-foreground px-1.5 py-0 uppercase tracking-widest font-mono">
                read-only
              </Badge>
            )}
            {tool.annotations?.destructiveHint && (
              <Badge variant="destructive" className="text-[10px] rounded-none bg-foreground text-background px-1.5 py-0 uppercase tracking-widest font-mono">
                destructive
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {tool.description && (
          <p className="text-sm font-medium text-foreground/60 leading-[1.6] max-w-[90%]">{tool.description}</p>
        )}

        {paramNames.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest font-mono">
              Parameters
            </p>
            <div className="flex flex-col">
              {paramNames.map((name) => {
                const param = properties![name];
                const isRequired = required?.includes(name);
                return (
                  <div
                    key={name}
                    className="flex items-baseline gap-3 text-xs border-t border-foreground/5 py-2"
                  >
                    <code className="font-mono font-bold">{name}</code>
                    {isRequired && (
                      <span className="text-background bg-foreground px-1 py-[1px] text-[9px] uppercase tracking-widest">req</span>
                    )}
                    {param?.type && (
                      <span className="text-foreground/40 font-mono text-[10px] uppercase tracking-wider">{param.type}</span>
                    )}
                    {param?.description && (
                      <span className="text-foreground/60 truncate max-w-[200px] lg:max-w-[300px]">
                        — {param.description}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tool.inputSchema && (
          <div>
            <button
              type="button"
              onClick={() => setShowSchema((v) => !v)}
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold text-foreground/40 hover:text-foreground transition-colors"
            >
              <span className="border border-foreground/20 p-0.5">
                {showSchema ? <ChevronUpIcon className="size-3" /> : <ChevronDownIcon className="size-3" />}
              </span>
              {showSchema ? "Hide Schema" : "Show Schema"}
            </button>
            {showSchema && (
              <pre className="mt-3 text-xs bg-foreground/5 border-2 border-foreground/10 rounded-none p-4 overflow-x-auto text-foreground/80 font-medium">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            )}
          </div>
        )}

        <button
          onClick={() => selectTool(tool.name)}
          className="mt-2 group/btn relative inline-flex items-center justify-between w-full border-2 border-foreground px-4 py-2 font-mono text-sm font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          <span>Test in Playground</span>
          <ArrowRightIcon className="size-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

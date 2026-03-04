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
    <Card className="gap-3 py-4">
      <CardHeader className="px-4 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-sm font-semibold">
            {tool.name}
          </CardTitle>
          <div className="flex items-center gap-1 flex-shrink-0">
            {tool.annotations?.readOnlyHint && (
              <Badge variant="secondary" className="text-xs">
                read-only
              </Badge>
            )}
            {tool.annotations?.destructiveHint && (
              <Badge variant="destructive" className="text-xs">
                destructive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 flex flex-col gap-3">
        {tool.description && (
          <p className="text-sm text-muted-foreground">{tool.description}</p>
        )}

        {paramNames.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Parameters
            </p>
            <div className="flex flex-col gap-1">
              {paramNames.map((name) => {
                const param = properties![name];
                const isRequired = required?.includes(name);
                return (
                  <div
                    key={name}
                    className="flex items-baseline gap-2 text-xs"
                  >
                    <code className="font-mono font-medium">{name}</code>
                    {isRequired && (
                      <span className="text-destructive text-[10px]">required</span>
                    )}
                    {param?.type && (
                      <span className="text-muted-foreground">{param.type}</span>
                    )}
                    {param?.description && (
                      <span className="text-muted-foreground truncate">
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
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSchema ? (
                <ChevronUpIcon className="size-3" />
              ) : (
                <ChevronDownIcon className="size-3" />
              )}
              {showSchema ? "Hide" : "Show"} full schema
            </button>
            {showSchema && (
              <pre className="mt-2 text-xs bg-muted rounded-md p-3 overflow-x-auto">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            )}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => selectTool(tool.name)}
          className="w-fit"
        >
          Test in Playground
          <ArrowRightIcon />
        </Button>
      </CardContent>
    </Card>
  );
}

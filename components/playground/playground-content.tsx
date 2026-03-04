"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2Icon, MousePointerClickIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToolSelector } from "@/components/playground/tool-selector";
import { ParamForm } from "@/components/playground/param-form";
import {
  ResponseViewer,
  type ToolCallResult,
  type ResponseMeta,
} from "@/components/playground/response-viewer";
import { ExecutionHistory } from "@/components/playground/execution-history";
import { useConnectionStore } from "@/stores/connection-store";
import { usePlaygroundStore } from "@/stores/playground-store";
import type { JSONSchema } from "@/components/playground/json-schema-form";

interface ToolCallResponse {
  result: ToolCallResult;
  meta: ResponseMeta;
}

export function PlaygroundContent() {
  const session = useConnectionStore((s) => s.session);
  const selectedToolName = usePlaygroundStore((s) => s.selectedToolName);
  const formValues = usePlaygroundStore((s) => s.formValues);
  const isExecuting = usePlaygroundStore((s) => s.isExecuting);
  const setExecuting = usePlaygroundStore((s) => s.setExecuting);
  const addResult = usePlaygroundStore((s) => s.addResult);

  const [executeError, setExecuteError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] =
    useState<ToolCallResponse | null>(null);

  // Reset result display when a different tool is selected
  const prevToolName = usePlaygroundStore((s) => s.selectedToolName);
  useEffect(() => {
    setCurrentResponse(null);
    setExecuteError(null);
  }, [prevToolName]);

  const selectedTool = session?.tools.find((t) => t.name === selectedToolName);

  const handleExecute = useCallback(async () => {
    if (!session || !selectedToolName || isExecuting) return;

    setExecuteError(null);
    setExecuting(true);

    try {
      const res = await fetch("/api/tools/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          toolName: selectedToolName,
          arguments: formValues,
        }),
      });

      const data = (await res.json()) as ToolCallResponse | { error: string };

      if (!res.ok || "error" in data) {
        const errMsg = "error" in data ? data.error : `HTTP ${res.status}`;
        setExecuteError(errMsg);
        setExecuting(false);
        return;
      }

      const { result, meta } = data as ToolCallResponse;
      setCurrentResponse({ result, meta });

      addResult({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        toolName: selectedToolName,
        arguments: formValues,
        result,
        isError: result?.isError ?? false,
        latencyMs: meta.latencyMs,
        responseBytes: meta.responseBytes,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setExecuteError(msg);
    } finally {
      setExecuting(false);
    }
  }, [session, selectedToolName, formValues, isExecuting, setExecuting, addResult]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleExecute();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExecute]);

  if (!selectedToolName || !selectedTool) {
    return (
      <div className="flex h-full">
        {/* Left: tool selector */}
        <div className="w-64 shrink-0 p-3">
          <ToolSelector />
        </div>

        <Separator orientation="vertical" />

        {/* Right: empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center py-16">
          <MousePointerClickIcon className="size-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Select a tool from the left panel to start testing
          </p>
        </div>
      </div>
    );
  }

  const inputSchema = (selectedTool.inputSchema ?? {}) as JSONSchema;

  return (
    <div className="flex h-full">
      {/* Left: tool selector */}
      <div className="w-64 shrink-0 p-3">
        <ToolSelector />
      </div>

      <Separator orientation="vertical" />

      {/* Right: main panel */}
      <ScrollArea className="flex-1 min-w-0">
        <div className="p-5 flex flex-col gap-5">
          {/* Tool header */}
          <div>
            <h2 className="font-mono text-base font-semibold">
              {selectedTool.name}
            </h2>
            {selectedTool.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTool.description}
              </p>
            )}
          </div>

          <Separator />

          {/* Parameters */}
          <div>
            <p className="text-sm font-medium mb-3">Parameters</p>
            <ParamForm schema={inputSchema} />
          </div>

          {/* Execute button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExecute}
              disabled={isExecuting}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <PlayIcon className="size-4" />
                  Execute
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              or press{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted text-xs font-mono">
                Ctrl+Enter
              </kbd>
            </span>
          </div>

          {/* Execute error */}
          {executeError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {executeError}
            </div>
          )}

          {/* Result */}
          {currentResponse && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Result</p>
                <ResponseViewer
                  result={currentResponse.result}
                  meta={currentResponse.meta}
                />
              </div>
            </>
          )}

          {/* Execution history */}
          <Separator />
          <ExecutionHistory />
        </div>
      </ScrollArea>
    </div>
  );
}

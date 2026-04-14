"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2Icon, MousePointerClickIcon, PlayIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ParamForm } from "@/components/playground/param-form";
import {
  ResponseViewer,
  type ToolCallResult,
  type ResponseMeta,
} from "@/components/playground/response-viewer";
import { ExecutionHistory } from "@/components/playground/execution-history";
import { useConnectionStore } from "@/stores/connection-store";
import { usePlaygroundStore } from "@/stores/playground-store";
import { useDesktopAgent } from "@/hooks/use-desktop-agent";
import type { JSONSchema } from "@/components/playground/json-schema-form";

interface ToolCallResponse {
  result: ToolCallResult;
  meta: ResponseMeta;
}

export function PlaygroundContent() {
  const session = useConnectionStore((s) => s.session);
  const isAgentSession = useConnectionStore((s) => s.isAgentSession);
  const selectedToolName = usePlaygroundStore((s) => s.selectedToolName);
  const formValues = usePlaygroundStore((s) => s.formValues);
  const isExecuting = usePlaygroundStore((s) => s.isExecuting);
  const setExecuting = usePlaygroundStore((s) => s.setExecuting);
  const addResult = usePlaygroundStore((s) => s.addResult);

  const { sendRequest } = useDesktopAgent();

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
      let resultData: ToolCallResponse;
      const startTime = Date.now();

      if (isAgentSession) {
        // Send tool call through agent WebSocket
        const payload = await sendRequest("call_tool", {
          sessionId: session.sessionId,
          name: selectedToolName,
          arguments: formValues,
        }) as Record<string, unknown>;

        // Map agent response to ToolCallResponse format
        // The agent returns the raw result from client.callTool()
        resultData = {
          result: {
            content: (payload?.content as ToolCallResult["content"]) || [],
            isError: (payload?.isError as boolean) || false,
          },
          meta: {
            latencyMs: Date.now() - startTime,
            responseBytes: JSON.stringify(payload).length,
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        // Send tool call through regular API route
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

        resultData = data as ToolCallResponse;
        resultData.meta.latencyMs = Date.now() - startTime;
        resultData.meta.timestamp = new Date().toISOString();
      }

      setCurrentResponse(resultData);

      addResult({
        id: crypto.randomUUID(),
        timestamp: new Date(),
        toolName: selectedToolName,
        arguments: formValues,
        result: resultData.result,
        isError: resultData.result?.isError ?? false,
        latencyMs: resultData.meta.latencyMs,
        responseBytes: resultData.meta.responseBytes,
      });

      // Optional: Auto scroll to result if desired.
      setTimeout(() => {
        document.getElementById("result-viewer")?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setExecuteError(msg);
    } finally {
      setExecuting(false);
    }
  }, [session, selectedToolName, formValues, isExecuting, setExecuting, addResult, isAgentSession, sendRequest]);

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
      <div className="flex flex-col h-full items-center justify-center gap-6 text-center py-16 bg-transparent relative z-10 p-8">
        <div className="bg-background/80 backdrop-blur-sm border border-foreground/10 rounded-2xl p-12 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6">
          <div className="bg-foreground/5 p-6 rounded-full">
            <MousePointerClickIcon className="size-12 text-foreground/40" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-mono text-base font-bold tracking-widest text-foreground uppercase">
              No Tool Selected
            </h3>
            <p className="text-sm text-foreground/50 font-medium">
              Select a tool from the sidebar to initialize its parameters and execute it within the connected session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputSchema = (selectedTool.inputSchema ?? {}) as JSONSchema;

  return (
    <ScrollArea className="flex-1 w-full min-w-0 bg-transparent h-full pb-32">
      <div className="px-6 py-10 md:px-16 md:py-16 flex flex-col max-w-5xl mx-auto z-10 relative">
        {/* Tool header */}
        <div className="pb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-background bg-foreground px-2 py-1 rounded shadow-sm">
              TOOL EXECUTION
            </span>
          </div>
          <h2 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-4 wrap-break-word">
            {selectedTool.name}
          </h2>
          {selectedTool.description && (
            <p className="text-lg font-medium text-foreground/60 leading-[1.6] max-w-3xl">
              {selectedTool.description}
            </p>
          )}
        </div>

        <Separator className="bg-foreground/10" />

        {/* Parameters */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-sm font-bold tracking-widest text-foreground/40 uppercase">Configuration Form</h3>
          </div>
          <div className="border border-foreground/10 rounded-xl p-6 md:p-8 bg-background shadow-lg shadow-black/5 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-foreground/10" />
            <ParamForm schema={inputSchema} />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-10 p-6 md:p-8 border border-foreground/10 rounded-xl bg-foreground/3 backdrop-blur transition-colors hover:bg-foreground/5">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="group/exec relative inline-flex items-center justify-center gap-3 w-full sm:w-auto min-w-50 bg-foreground text-background px-8 py-4 rounded-md font-mono text-sm md:text-base font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] md:hover:-translate-y-0.5"
            >
              {isExecuting ? (
                <>
                  <Loader2Icon className="size-5 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <PlayIcon className="size-5 fill-background" />
                  EXECUTE
                </>
              )}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 hidden sm:flex items-center gap-2">
              or
              <kbd className="px-2 py-1 rounded border border-foreground/10 bg-background text-foreground font-bold shadow-sm">
                Ctrl+Enter
              </kbd>
            </span>
          </div>
        </div>

        {/* Execute error */}
        {executeError && (
          <div className="mt-8 text-sm font-bold text-destructive bg-destructive/10 border border-destructive/20 px-6 py-4 rounded-lg tracking-wide shadow-sm">
            ERROR: {executeError}
          </div>
        )}

        {/* Result Context */}
        {currentResponse && (
          <div className="mt-16 scroll-mt-6" id="result-viewer">
            <h3 className="font-mono text-sm font-bold text-foreground/40 tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 
              Latest Response Payload
            </h3>
            <div className="rounded-xl border border-foreground/10 bg-background overflow-hidden shadow-2xl">
              <ResponseViewer
                result={currentResponse.result}
                meta={currentResponse.meta}
              />
            </div>
          </div>
        )}

        {/* Execution history */}
        <div className="mt-20 pt-16 border-t border-foreground/10">
          <ExecutionHistory />
        </div>
      </div>
    </ScrollArea>
  );
}

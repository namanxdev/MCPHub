"use client";

import { useState, useCallback } from "react";
import { CopyIcon, DownloadIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// MCP content block shapes
interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image";
  data?: string;
  url?: string;
  mimeType?: string;
}

interface ResourceContent {
  type: "resource";
  resource?: {
    uri?: string;
    text?: string;
  };
}

type ContentBlock = TextContent | ImageContent | ResourceContent;

export interface ToolCallResult {
  content?: ContentBlock[];
  isError?: boolean;
}

export interface ResponseMeta {
  latencyMs: number;
  responseBytes: number;
  timestamp: string;
}

interface ResponseViewerProps {
  result: ToolCallResult;
  meta: ResponseMeta;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TextBlock({ block }: { block: TextContent }) {
  return (
    <pre className="text-sm whitespace-pre-wrap break-words bg-muted rounded-md p-3 font-mono">
      {block.text}
    </pre>
  );
}

function ImageBlock({ block }: { block: ImageContent }) {
  const src = block.data
    ? `data:${block.mimeType ?? "image/png"};base64,${block.data}`
    : (block.url ?? "");

  if (!src) {
    return (
      <div className="text-sm text-muted-foreground italic p-3 bg-muted rounded-md">
        Image data unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Tool result"
      className="max-w-full rounded-md border"
    />
  );
}

function ResourceBlock({ block }: { block: ResourceContent }) {
  const uri = block.resource?.uri;
  const text = block.resource?.text;
  return (
    <div className="text-sm bg-muted rounded-md p-3 space-y-1">
      {uri && (
        <p className="font-mono text-xs text-muted-foreground break-all">{uri}</p>
      )}
      {text && <p className="text-sm">{text}</p>}
    </div>
  );
}

function FormattedContent({ result }: { result: ToolCallResult }) {
  if (result.isError) {
    const errorText =
      result.content
        ?.filter((b): b is TextContent => b.type === "text")
        .map((b) => b.text)
        .join("\n") ?? "Tool call failed";

    return (
      <div className="flex gap-2 items-start bg-destructive/10 border border-destructive/20 rounded-md p-3">
        <AlertCircleIcon className="size-4 text-destructive mt-0.5 shrink-0" />
        <pre className="text-sm text-destructive whitespace-pre-wrap break-words">
          {errorText}
        </pre>
      </div>
    );
  }

  if (!result.content || result.content.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No content returned.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {result.content.map((block, i) => {
        if (block.type === "text") {
          return <TextBlock key={i} block={block} />;
        }
        if (block.type === "image") {
          return <ImageBlock key={i} block={block} />;
        }
        if (block.type === "resource") {
          return <ResourceBlock key={i} block={block} />;
        }
        return null;
      })}
    </div>
  );
}

export function ResponseViewer({ result, meta }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  const rawJson = JSON.stringify(result, null, 2);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rawJson]);

  function handleDownload() {
    const blob = new Blob([rawJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tool-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Meta bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={result.isError ? "destructive" : "secondary"}>
          {result.isError ? "Error" : "Success"}
        </Badge>
        <span className="text-xs text-muted-foreground">{meta.latencyMs}ms</span>
        <span className="text-xs text-muted-foreground">
          {formatBytes(meta.responseBytes)}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(meta.timestamp).toLocaleTimeString()}
        </span>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? (
            <>
              <CheckIcon className="size-3.5" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              Copy
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <DownloadIcon className="size-3.5" />
          Download
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="formatted">
        <TabsList>
          <TabsTrigger value="formatted">Formatted</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="formatted" className="mt-3">
          <FormattedContent result={result} />
        </TabsContent>
        <TabsContent value="raw" className="mt-3">
          <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap break-words">
            {rawJson}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}

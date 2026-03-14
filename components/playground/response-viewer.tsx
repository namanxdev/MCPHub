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
    <pre className="text-sm whitespace-pre-wrap break-words bg-foreground/[0.02] border-2 border-foreground/10 p-6 font-mono text-foreground leading-relaxed">
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
      <div className="flex gap-4 items-start bg-foreground text-background border-2 border-foreground p-6 font-mono">
        <AlertCircleIcon className="size-6 text-background mt-0.5 shrink-0" />
        <pre className="text-sm text-background whitespace-pre-wrap break-words font-bold uppercase tracking-wide">
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
    <div className="flex flex-col gap-6">
      {/* Meta bar */}
      <div className="flex items-center gap-4 flex-wrap pb-6 border-b-2 border-foreground/10">
        <div className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest border-2 ${result.isError ? "border-foreground bg-foreground text-background" : "border-foreground/20 text-foreground"}`}>
          {result.isError ? "ERROR" : "SUCCESS"}
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/40">{meta.latencyMs}MS</span>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/40">
          {formatBytes(meta.responseBytes)}
        </span>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground/40 ml-auto mr-4 group hover:text-foreground cursor-default transition-colors">
          <span className="text-foreground/20 mr-2 group-hover:text-foreground/40 transition-colors">TS</span>{new Date(meta.timestamp).toLocaleTimeString()}
        </span>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 border-2 border-foreground/20 text-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:border-foreground transition-colors w-28">
            {copied ? (
              <>
                <CheckIcon className="size-3.5" />
                COPIED
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5" />
                COPY
              </>
            )}
          </button>
          <button onClick={handleDownload} className="inline-flex items-center justify-center gap-2 border-2 border-foreground/20 text-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:border-foreground transition-colors">
            <DownloadIcon className="size-3.5" />
            DOWNLOAD
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="formatted" className="rounded-none">
        <TabsList className="flex border-b-2 border-foreground/10 bg-transparent h-12 p-0 justify-start w-fit">
          <TabsTrigger value="formatted" className="rounded-none border-x-2 border-t-2 border-transparent data-[state=active]:border-foreground/10 data-[state=active]:bg-foreground/[0.02] data-[state=active]:text-foreground h-full px-8 font-mono uppercase tracking-widest text-xs font-bold transition-all data-[state=inactive]:text-foreground/40 hover:text-foreground">FORMATTED</TabsTrigger>
          <TabsTrigger value="raw" className="rounded-none border-r-2 border-t-2 border-transparent data-[state=active]:border-foreground/10 data-[state=active]:bg-foreground/[0.02] data-[state=active]:text-foreground h-full px-8 font-mono uppercase tracking-widest text-xs font-bold transition-all data-[state=inactive]:text-foreground/40 hover:text-foreground">RAW JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="formatted" className="mt-6">
          <FormattedContent result={result} />
        </TabsContent>
        <TabsContent value="raw" className="mt-6">
          <pre className="text-sm font-mono bg-foreground/[0.02] border-2 border-foreground/10 p-6 overflow-auto max-h-[60vh] whitespace-pre-wrap break-words text-foreground">
            {rawJson}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/components/registry/category-filter";

const TRANSPORT_OPTIONS = [
  { label: "SSE (Server-Sent Events)", value: "sse" },
  { label: "Streamable HTTP", value: "streamable-http" },
] as const;

interface FieldErrors {
  url?: string;
  name?: string;
  shortDescription?: string;
  longDescription?: string;
  categories?: string;
  tags?: string;
  authorName?: string;
  authorUrl?: string;
  repoUrl?: string;
  transportType?: string;
  command?: string;
}

interface SubmitSuccess {
  slug: string;
  name: string;
  status: string;
}

type ServerType = "hosted" | "local";

export function SubmitForm() {
  const [serverType, setServerType] = useState<ServerType>("hosted");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorUrl, setAuthorUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [transportType, setTransportType] = useState<"sse" | "streamable-http">("sse");
  const [connectionGuide, setConnectionGuide] = useState("");

  // Local server fields
  const [command, setCommand] = useState("");
  const [requiredEnvVars, setRequiredEnvVars] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SubmitSuccess | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const isLocal = serverType === "local";

  const toggleCategory = useCallback((value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }, []);

  function validate(): boolean {
    const errs: FieldErrors = {};

    if (isLocal) {
      if (!command.trim()) errs.command = "Command is required";
      else if (command.length > 500) errs.command = "Max 500 characters";
    } else {
      if (!url.trim()) errs.url = "URL is required";
      else {
        try {
          new URL(url);
        } catch {
          errs.url = "Must be a valid URL";
        }
      }
    }

    if (!name.trim()) errs.name = "Name is required";
    else if (name.length > 100) errs.name = "Max 100 characters";

    if (!shortDescription.trim())
      errs.shortDescription = "Short description is required";
    else if (shortDescription.length > 280)
      errs.shortDescription = "Max 280 characters";

    if (longDescription && longDescription.length > 5000)
      errs.longDescription = "Max 5000 characters";

    if (selectedCategories.length === 0)
      errs.categories = "Select at least one category";

    if (!authorName.trim()) errs.authorName = "Author name is required";

    if (authorUrl && authorUrl.trim()) {
      try {
        new URL(authorUrl);
      } catch {
        errs.authorUrl = "Must be a valid URL";
      }
    }

    if (repoUrl && repoUrl.trim()) {
      try {
        new URL(repoUrl);
      } catch {
        errs.repoUrl = "Must be a valid URL";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const parsedEnvVars = requiredEnvVars
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = {
        name,
        shortDescription,
        longDescription: longDescription || undefined,
        categories: selectedCategories,
        tags: parsedTags,
        authorName,
        authorUrl: authorUrl || undefined,
        repoUrl: repoUrl || undefined,
        serverType,
        connectionGuide: connectionGuide || undefined,
      };

      if (isLocal) {
        payload.command = command;
        payload.transportType = "stdio";
        payload.requiredEnvVars = parsedEnvVars;
      } else {
        payload.url = url;
        payload.transportType = transportType;
      }

      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setServerError("This server URL is already registered.");
        return;
      }

      if (!res.ok) {
        setServerError(
          data?.error ?? "Submission failed. Please try again."
        );
        return;
      }

      setSuccess({
        slug: data.server.slug,
        name: data.server.name,
        status: data.status,
      });
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircleIcon className="size-12 text-green-500" />
        <h2 className="text-xl font-semibold">Server submitted!</h2>
        <p className="text-muted-foreground max-w-md">
          <strong>{success.name}</strong> has been{" "}
          {success.status === "approved" ? "verified and added" : "queued for review"}{" "}
          in the registry.
        </p>
        <div className="flex gap-3 mt-2">
          <Button asChild>
            <Link href={`/registry/${success.slug}`}>View Listing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/registry">Browse Registry</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {serverError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Server Type Toggle */}
      <div className="flex flex-col gap-2">
        <Label>Server Type</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setServerType("hosted")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors ${
              !isLocal
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground"
            }`}
          >
            Hosted Server
          </button>
          <button
            type="button"
            onClick={() => setServerType("local")}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors ${
              isLocal
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground"
            }`}
          >
            Local Command
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {isLocal
            ? "A local MCP server that runs via a command (e.g. npx, uvx). Users run it on their own machine."
            : "A remotely hosted MCP server accessible via URL."}
        </p>
      </div>

      {isLocal ? (
        <>
          {/* Command */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="command">
              Command <span className="text-destructive">*</span>
            </Label>
            <Input
              id="command"
              placeholder="npx -y @modelcontextprotocol/server-github"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              maxLength={500}
              aria-invalid={!!errors.command}
            />
            {errors.command && (
              <p className="text-xs text-destructive">{errors.command}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The command users will run to start this MCP server locally.
            </p>
          </div>

          {/* Required Env Vars */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requiredEnvVars">
              Required Environment Variables{" "}
              <span className="text-muted-foreground text-xs">(comma-separated names)</span>
            </Label>
            <Input
              id="requiredEnvVars"
              placeholder="GITHUB_PERSONAL_ACCESS_TOKEN, API_KEY"
              value={requiredEnvVars}
              onChange={(e) => setRequiredEnvVars(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Environment variable names the server requires (values are never stored).
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Server URL + Transport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url">
                Server URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://my-mcp-server.com/mcp"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={!!errors.url}
              />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transportType">
                Transport Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="transportType"
                value={transportType}
                onChange={(e) =>
                  setTransportType(e.target.value as "sse" | "streamable-http")
                }
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              >
                {TRANSPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">
          Server Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="My MCP Server"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Short Description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="shortDescription">
            Short Description <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {shortDescription.length}/280
          </span>
        </div>
        <Input
          id="shortDescription"
          placeholder="One-sentence description of what your server does"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          maxLength={280}
          aria-invalid={!!errors.shortDescription}
        />
        {errors.shortDescription && (
          <p className="text-xs text-destructive">{errors.shortDescription}</p>
        )}
      </div>

      {/* Long Description */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="longDescription">
            Long Description{" "}
            <span className="text-muted-foreground text-xs">(optional, markdown)</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {longDescription.length}/5000
          </span>
        </div>
        <Textarea
          id="longDescription"
          placeholder="Full description, usage instructions, requirements..."
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          maxLength={5000}
          className="min-h-32"
          aria-invalid={!!errors.longDescription}
        />
        {errors.longDescription && (
          <p className="text-xs text-destructive">{errors.longDescription}</p>
        )}
      </div>

      {/* Connection Guide */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="connectionGuide">
            Connection Guide{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {connectionGuide.length}/2000
          </span>
        </div>
        <Textarea
          id="connectionGuide"
          placeholder={isLocal
            ? "Instructions for setting up env vars, prerequisites, etc."
            : "Instructions for connecting to this server (auth setup, etc.)"}
          value={connectionGuide}
          onChange={(e) => setConnectionGuide(e.target.value)}
          maxLength={2000}
          className="min-h-20"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-2">
        <Label>
          Categories <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.value !== "").map((cat) => {
            const active = selectedCategories.includes(cat.value);
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        {errors.categories && (
          <p className="text-xs text-destructive">{errors.categories}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">
          Tags{" "}
          <span className="text-muted-foreground text-xs">(comma-separated)</span>
        </Label>
        <Input
          id="tags"
          placeholder="api, weather, real-time"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {/* Author */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="authorName">
            Author Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="authorName"
            placeholder="Your name or organization"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            aria-invalid={!!errors.authorName}
          />
          {errors.authorName && (
            <p className="text-xs text-destructive">{errors.authorName}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="authorUrl">
            Author URL{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="authorUrl"
            type="url"
            placeholder="https://example.com"
            value={authorUrl}
            onChange={(e) => setAuthorUrl(e.target.value)}
            aria-invalid={!!errors.authorUrl}
          />
          {errors.authorUrl && (
            <p className="text-xs text-destructive">{errors.authorUrl}</p>
          )}
        </div>
      </div>

      {/* Repo URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="repoUrl">
          Repository URL{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="repoUrl"
          type="url"
          placeholder="https://github.com/org/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          aria-invalid={!!errors.repoUrl}
        />
        {errors.repoUrl && (
          <p className="text-xs text-destructive">{errors.repoUrl}</p>
        )}
      </div>

      <Button type="submit" disabled={submitting} className="w-full md:w-auto">
        {submitting ? "Validating & Submitting..." : "Submit Server"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Code2Icon, RotateCcwIcon, BookmarkIcon, FolderOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JsonSchemaForm, type JSONSchema } from "@/components/playground/json-schema-form";
import { usePlaygroundStore } from "@/stores/playground-store";
import { useConnectionStore } from "@/stores/connection-store";

// --- Preset helpers (localStorage) ---

interface Preset {
  name: string;
  values: Record<string, unknown>;
  savedAt: string;
}

function presetKey(serverUrl: string, toolName: string) {
  return `mcphub:presets:${serverUrl}:${toolName}`;
}

function savePreset(
  serverUrl: string,
  toolName: string,
  name: string,
  values: Record<string, unknown>
) {
  const key = presetKey(serverUrl, toolName);
  const existing: Preset[] = JSON.parse(localStorage.getItem(key) ?? "[]");
  localStorage.setItem(
    key,
    JSON.stringify([
      ...existing,
      { name, values, savedAt: new Date().toISOString() },
    ])
  );
}

function loadPresets(serverUrl: string, toolName: string): Preset[] {
  const key = presetKey(serverUrl, toolName);
  return JSON.parse(localStorage.getItem(key) ?? "[]");
}

// --- Component ---

interface ParamFormProps {
  schema: JSONSchema;
}

export function ParamForm({ schema }: ParamFormProps) {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsLoaded, setPresetsLoaded] = useState(false);

  const formValues = usePlaygroundStore((s) => s.formValues);
  const setFormValues = usePlaygroundStore((s) => s.setFormValues);
  const selectedToolName = usePlaygroundStore((s) => s.selectedToolName);
  const session = useConnectionStore((s) => s.session);

  const serverUrl = session?.url ?? "";
  const toolName = selectedToolName ?? "";

  // Switch to JSON mode — serialize current form values
  function handleToggleJsonMode() {
    if (!jsonMode) {
      setJsonText(JSON.stringify(formValues, null, 2));
      setJsonError(null);
    } else {
      // Apply JSON back to form values on exit
      try {
        const parsed = JSON.parse(jsonText || "{}");
        setFormValues(parsed);
        setJsonError(null);
      } catch {
        // Keep JSON mode open so user can fix errors
        setJsonError("Invalid JSON — fix before switching back to form view.");
        return;
      }
    }
    setJsonMode((v) => !v);
  }

  function handleJsonChange(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text || "{}");
      setFormValues(parsed);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  function handleReset() {
    setFormValues({});
    setJsonText("{}");
    setJsonError(null);
  }

  function handleSavePreset() {
    const name = window.prompt("Preset name:");
    if (!name?.trim()) return;
    savePreset(serverUrl, toolName, name.trim(), formValues);
    // Refresh list if already loaded
    if (presetsLoaded) {
      setPresets(loadPresets(serverUrl, toolName));
    }
  }

  const handleOpenPresets = useCallback(() => {
    setPresets(loadPresets(serverUrl, toolName));
    setPresetsLoaded(true);
  }, [serverUrl, toolName]);

  function handleLoadPreset(presetName: string) {
    const preset = presets.find((p) => p.name === presetName);
    if (!preset) return;
    setFormValues(preset.values);
    if (jsonMode) {
      setJsonText(JSON.stringify(preset.values, null, 2));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6 border-b-2 border-foreground/10 pb-6">
        <button
          onClick={handleToggleJsonMode}
          className="inline-flex items-center justify-center gap-2 border-2 border-foreground text-foreground px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          <Code2Icon className="size-4" />
          {jsonMode ? "FORM VIEW" : "EDIT AS JSON"}
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-2 border-2 border-foreground/20 text-foreground px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:border-foreground transition-colors"
        >
          <RotateCcwIcon className="size-4" />
          RESET
        </button>
        <button
          onClick={handleSavePreset}
          className="inline-flex items-center justify-center gap-2 border-2 border-foreground/20 text-foreground px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:border-foreground transition-colors"
        >
          <BookmarkIcon className="size-4" />
          SAVE PRESET
        </button>
        {/* Load preset select */}
        <Select onValueChange={handleLoadPreset} onOpenChange={(open) => { if (open) handleOpenPresets(); }}>
          <SelectTrigger className="h-10 w-48 rounded-none border-2 border-foreground/20 bg-transparent text-xs font-mono font-bold uppercase tracking-widest gap-2 focus:ring-0 focus:border-foreground">
            <div className="flex items-center gap-2">
              <FolderOpenIcon className="size-4 text-foreground/50" />
              <SelectValue placeholder="LOAD PRESET" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-foreground">
            {presets.length === 0 ? (
              <div className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-foreground/50">
                NO PRESETS
              </div>
            ) : (
              presets.map((p) => (
                <SelectItem key={p.savedAt} value={p.name} className="font-mono text-xs uppercase cursor-pointer rounded-none focus:bg-foreground focus:text-background">
                  {p.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Form or JSON editor */}
      {jsonMode ? (
        <div className="space-y-4">
          <Label className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60">Arguments (JSON)</Label>
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={12}
            className="font-mono text-sm rounded-none border-2 border-foreground/10 bg-foreground/[0.02] p-4 focus-visible:ring-0 focus-visible:border-foreground transition-colors"
            spellCheck={false}
          />
          {jsonError && (
            <p className="text-xs font-mono uppercase tracking-widest font-bold text-background bg-foreground px-4 py-2 mt-2 inline-block">
              {jsonError}
            </p>
          )}
        </div>
      ) : (
        <JsonSchemaForm
          schema={schema}
          value={formValues}
          onChange={setFormValues}
        />
      )}
    </div>
  );
}

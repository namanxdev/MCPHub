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
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleJsonMode}
          className="gap-1.5"
        >
          <Code2Icon className="size-3.5" />
          {jsonMode ? "Form view" : "Edit as JSON"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5"
        >
          <RotateCcwIcon className="size-3.5" />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSavePreset}
          className="gap-1.5"
        >
          <BookmarkIcon className="size-3.5" />
          Save preset
        </Button>
        {/* Load preset select */}
        <Select onValueChange={handleLoadPreset} onOpenChange={(open) => { if (open) handleOpenPresets(); }}>
          <SelectTrigger className="h-8 w-36 text-xs gap-1.5">
            <FolderOpenIcon className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Load preset" />
          </SelectTrigger>
          <SelectContent>
            {presets.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No saved presets
              </div>
            ) : (
              presets.map((p) => (
                <SelectItem key={p.savedAt} value={p.name}>
                  {p.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Form or JSON editor */}
      {jsonMode ? (
        <div className="space-y-1.5">
          <Label>Arguments (JSON)</Label>
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            spellCheck={false}
          />
          {jsonError && (
            <p className="text-xs text-destructive">{jsonError}</p>
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

"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// Type for JSON Schema
export type JSONSchema = {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  enum?: unknown[];
  required?: string[];
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  minLength?: number;
  format?: string;
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  title?: string;
};

interface SchemaFieldProps {
  name: string;
  schema: JSONSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  required?: boolean;
  depth?: number;
}

function SchemaField({
  name,
  schema,
  value,
  onChange,
  required,
  depth = 0,
}: SchemaFieldProps) {
  const label = schema.title || name;
  const fieldId = `field-${name}-${depth}`;

  // Handle enum
  if (schema.enum) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger id={fieldId} className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {schema.enum.map((opt) => (
              <SelectItem key={String(opt)} value={String(opt)}>
                {String(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  // Boolean
  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch
          id={fieldId}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {schema.description && (
          <p className="text-xs text-muted-foreground ml-2">
            {schema.description}
          </p>
        )}
      </div>
    );
  }

  // Number / Integer
  if (type === "number" || type === "integer") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={fieldId}
          type="number"
          value={value !== undefined && value !== null ? String(value) : ""}
          onChange={(e) =>
            onChange(
              e.target.value === "" ? undefined : Number(e.target.value)
            )
          }
          min={schema.minimum}
          max={schema.maximum}
          step={type === "integer" ? 1 : undefined}
          placeholder={schema.description}
        />
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  }

  // Object
  if (type === "object" && schema.properties) {
    return (
      <div className={`space-y-3 ${depth > 0 ? "pl-4 border-l" : ""}`}>
        <Label className="font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
        {Object.entries(schema.properties).map(([key, propSchema]) => (
          <SchemaField
            key={key}
            name={key}
            schema={propSchema}
            value={(value as Record<string, unknown>)?.[key]}
            onChange={(v) =>
              onChange({
                ...((value as Record<string, unknown>) || {}),
                [key]: v,
              })
            }
            required={schema.required?.includes(key)}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  // Array
  if (type === "array") {
    const items = (value as unknown[]) || [];
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              {schema.items ? (
                <SchemaField
                  name={`${name}[${i}]`}
                  schema={schema.items}
                  value={item}
                  onChange={(v) => {
                    const next = [...items];
                    next[i] = v;
                    onChange(next);
                  }}
                  depth={depth + 1}
                />
              ) : (
                <Input
                  value={String(item)}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = e.target.value;
                    onChange(next);
                  }}
                />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, schema.items?.default ?? ""])}
        >
          + Add Item
        </Button>
      </div>
    );
  }

  // String (default) — long text = textarea
  const isLong = schema.maxLength && schema.maxLength > 200;
  if (isLong) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={fieldId}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={schema.description}
          rows={4}
        />
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  }

  // String (default)
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={fieldId}
        type={
          schema.format === "uri"
            ? "url"
            : schema.format === "date"
              ? "date"
              : "text"
        }
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={schema.description}
        maxLength={schema.maxLength}
        minLength={schema.minLength}
      />
      {schema.description && (
        <p className="text-xs text-muted-foreground">{schema.description}</p>
      )}
    </div>
  );
}

interface JsonSchemaFormProps {
  schema: JSONSchema;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function JsonSchemaForm({ schema, value, onChange }: JsonSchemaFormProps) {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        This tool requires no parameters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(([key, propSchema]) => (
        <SchemaField
          key={key}
          name={key}
          schema={propSchema}
          value={value[key]}
          onChange={(v) => onChange({ ...value, [key]: v })}
          required={schema.required?.includes(key)}
        />
      ))}
    </div>
  );
}

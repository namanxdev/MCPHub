# Feature 02: Interactive Tool Playground

> Select a tool, fill parameters via an auto-generated form, execute it, and see the response — all from the browser.

---

## Table of Contents

1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Sub-features](#sub-features)
4. [Technical Implementation](#technical-implementation)
5. [UI Specification](#ui-specification)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)
7. [Verification Criteria](#verification-criteria)

---

## Overview

The Interactive Tool Playground is the **core value proposition** of MCPHub. It takes the most tedious part of MCP development — manually constructing JSON-RPC `tools/call` messages — and replaces it with a visual, form-based interface that anyone can use.

### What It Does

1. After connecting to an MCP server (via Feature 01), the playground shows all available tools
2. User selects a tool from a sidebar/dropdown
3. MCPHub reads the tool's `inputSchema` (a JSON Schema definition) and **auto-generates a form**:
   - String params → text inputs
   - Number params → number inputs
   - Boolean params → toggles/checkboxes
   - Enum params → dropdowns
   - Object params → nested form groups
   - Array params → repeatable field groups
4. User fills in the parameters and clicks "Execute"
5. MCPHub sends a `tools/call` JSON-RPC message to the server via the backend proxy
6. The response is displayed in a formatted viewer — with both the rendered content and the raw JSON available

### Why This Matters

Without MCPHub, testing an MCP tool requires either:
- Using MCP Inspector (local CLI, basic UI, no persistence)
- Manually constructing JSON-RPC messages with curl
- Writing test code that imports the MCP SDK

The Playground makes tool testing **as easy as filling out a web form** — lowering the barrier for both server authors (testing during development) and consumers (evaluating before integration).

---

## User Stories

### US-2.1: Server Developer Tests During Development
> *As an MCP server developer, I want to test each tool with different inputs and see the responses immediately, so I can catch bugs and validate behavior during development.*

**Acceptance:** I can select any tool, fill in parameters via a form, execute, see the response in under 2 seconds, modify parameters, and re-execute — in a rapid iteration loop.

### US-2.2: Developer Evaluates a New Server
> *As a developer considering an MCP server for my project, I want to try out its tools hands-on before committing to integration, so I can understand exactly what it does.*

**Acceptance:** Without writing any code, I can invoke every tool on a server, see real responses, and understand the data format returned.

### US-2.3: QA Engineer Tests Edge Cases
> *As a QA engineer, I want to invoke tools with edge-case inputs (empty strings, very large numbers, missing optional fields, invalid types) to test server robustness.*

**Acceptance:** I can leave optional fields empty, enter boundary values, and see how the server responds — including error messages.

### US-2.4: Developer Saves Test Cases
> *As a developer, I want to save parameter presets for frequently tested scenarios so I don't have to re-enter them every time.*

**Acceptance:** After filling in a form, I can save the parameters as a named preset. Loading a preset fills in all fields automatically.

---

## Sub-features

### SF-2.1: Tool Selector
- Sidebar or dropdown listing all tools from the connected server
- Each entry shows: tool name (monospace) + first line of description
- Search/filter bar for servers with many tools
- Currently selected tool is highlighted
- Badge count showing total tools

### SF-2.2: Auto-Generated Parameter Form
This is the most technically complex sub-feature. Given a tool's `inputSchema` (JSON Schema), generate a usable HTML form.

**Type Mappings:**

| JSON Schema Type | Form Control | Details |
|-----------------|-------------|---------|
| `string` | Text input | With `maxLength`, `minLength`, `pattern` validation |
| `string` + `enum` | Dropdown select | Options from enum array |
| `string` + `format: "date"` | Date picker | HTML date input |
| `string` + `format: "uri"` | URL input | With URL validation |
| `string` + long description | Textarea | If description suggests long-form input, or `maxLength > 200` |
| `number` / `integer` | Number input | With `minimum`, `maximum`, `multipleOf` |
| `boolean` | Toggle switch | On/off with default value |
| `array` | Repeatable field group | "Add item" / "Remove item" buttons; each item renders its `items` schema |
| `object` | Nested form section | Indented group with border, each property rendered recursively |
| `oneOf` / `anyOf` | Radio group → conditional form | Select which variant, then show that variant's form |
| No schema / empty | Raw JSON textarea | Fallback: user enters raw JSON |

**Form Behaviors:**
- Required fields marked with red asterisk (*)
- Descriptions shown as help text below each field
- Default values pre-filled from `default` keyword
- Real-time validation against the JSON Schema
- "Reset to defaults" button
- "Edit as JSON" toggle — switch between form view and raw JSON editor

### SF-2.3: Execute Button & Loading State
- "Execute" button — enabled only when required fields are filled and validation passes
- Loading spinner during execution
- Cancel button for long-running tools
- Keyboard shortcut: `Ctrl/Cmd + Enter` to execute
- Execution timer showing elapsed time

### SF-2.4: Response Viewer
Displays the `tools/call` response in multiple views:

**Formatted View (default):**
- MCP content blocks are rendered by type:
  - `text` content → formatted text (with markdown rendering if it looks like markdown)
  - `image` content → inline image display (base64 decoded or URL)
  - `resource` content → link to resource with preview
- `isError: true` responses → red error box with error message

**Raw JSON View:**
- Full JSON-RPC response with syntax highlighting
- Copy to clipboard button
- Collapsible nested objects

**Metadata Bar:**
- Response time (e.g., "423ms")
- Response size (e.g., "2.1 KB")
- Content type (text/image/resource)
- `isError` status

### SF-2.5: Parameter Presets
- "Save as Preset" button after filling a form
- Name the preset (e.g., "Search for weather", "Large query test")
- Presets stored in localStorage keyed by server URL + tool name
- Dropdown to load a saved preset
- Delete preset option
- Import/export presets as JSON (for sharing)

### SF-2.6: Request History
- Log of all `tools/call` executions in the current session
- Each entry: timestamp, tool name, truncated params, response time, success/error
- Click to expand: full parameters and response
- "Replay" button to re-execute with the same parameters
- "Copy as JSON-RPC" button for the raw request message

### SF-2.7: Response Diff
- Select two responses from history
- Side-by-side diff view (highlight additions/removals/changes)
- Useful for: regression testing, comparing different param values, before/after server changes

### SF-2.8: Export Options
- Copy response to clipboard (formatted or raw)
- Download response as JSON file
- Copy as cURL command (reconstructed HTTP request)
- Copy as JSON-RPC message (the raw `tools/call` request)

---

## Technical Implementation

### API Route: `POST /api/tools/call`

**Request:**
```json
{
  "sessionId": "uuid-v4",
  "toolName": "search_web",
  "arguments": {
    "query": "MCP protocol specification",
    "max_results": 5
  }
}
```

**Flow:**
1. **Validate request** — Zod schema: sessionId required, toolName required (string), arguments required (object)
2. **Get client** — Look up MCP client from `ConnectionManager` using sessionId
3. **Validate arguments against tool schema** (optional server-side validation):
   - Retrieve the tool's `inputSchema` from cached capabilities
   - Validate `arguments` against the schema (catch obvious errors before sending to server)
4. **Start timing** — Record `Date.now()` before call
5. **Execute tool call:**
   ```typescript
   const result = await client.callTool({
     name: toolName,
     arguments: args
   });
   ```
6. **Record metrics** — Latency, response size, success/error (feeds into Feature 04: Health Dashboard)
7. **Log protocol messages** — Capture the raw JSON-RPC request/response (feeds into Feature 03: Protocol Inspector)
8. **Return response**

**Response (success):**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Here are the search results for 'MCP protocol specification':\n\n1. ..."
      }
    ],
    "isError": false
  },
  "meta": {
    "latencyMs": 423,
    "responseBytes": 2148,
    "timestamp": "2026-03-04T10:30:00Z"
  }
}
```

**Response (tool error — server returned `isError: true`):**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: Rate limit exceeded. Please try again in 60 seconds."
      }
    ],
    "isError": true
  },
  "meta": {
    "latencyMs": 150,
    "responseBytes": 312,
    "timestamp": "2026-03-04T10:30:05Z"
  }
}
```

**Error responses (MCPHub-level):**
- `400` — Missing sessionId or toolName
- `404` — Session not found (expired or invalid)
- `408` — Tool execution timed out (configurable, default 60s)
- `502` — MCP server connection lost during execution
- `500` — Unexpected error

### JSON Schema → Form Generation (`components/playground/json-schema-form.tsx`)

This is the most complex frontend component. It recursively renders a JSON Schema as a React form.

**Architecture:**
```typescript
// Entry point
function JsonSchemaForm({
  schema: JSONSchema;          // The tool's inputSchema
  value: Record<string, any>;  // Current form values
  onChange: (value: Record<string, any>) => void;
  errors: Record<string, string>;  // Validation errors
}) {
  // Renders each property of the schema's "properties" object
  return Object.entries(schema.properties).map(([key, propSchema]) => (
    <SchemaField
      key={key}
      name={key}
      schema={propSchema}
      value={value[key]}
      onChange={(v) => onChange({ ...value, [key]: v })}
      required={schema.required?.includes(key)}
      error={errors[key]}
    />
  ));
}

// Recursive field renderer
function SchemaField({ name, schema, value, onChange, required, error }) {
  switch (schema.type) {
    case "string":
      if (schema.enum) return <SelectField ... />;
      if (schema.maxLength > 200) return <TextareaField ... />;
      return <TextField ... />;
    case "number":
    case "integer":
      return <NumberField ... />;
    case "boolean":
      return <ToggleField ... />;
    case "array":
      return <ArrayField ... />;  // Renders items with add/remove
    case "object":
      return <ObjectField ... />;  // Recursively renders nested properties
    default:
      return <RawJsonField ... />;  // Fallback
  }
}
```

**Validation:**
- Client-side validation using `ajv` (JSON Schema validator) or custom Zod-based validation
- Validate on blur and on submit
- Show inline error messages per field
- Disable Execute button if validation fails

### Client-Side State (Zustand Store)

```typescript
interface PlaygroundStore {
  // Current selection
  selectedToolName: string | null;
  
  // Form state
  formValues: Record<string, any>;
  formErrors: Record<string, string>;
  isFormValid: boolean;
  
  // Execution state
  isExecuting: boolean;
  executionStartTime: number | null;
  
  // Results
  lastResult: ToolCallResult | null;
  
  // History
  executionHistory: ExecutionRecord[];
  
  // Presets
  presets: Record<string, ParameterPreset[]>;  // keyed by "serverUrl:toolName"
  
  // Actions
  selectTool(name: string): void;
  setFormValues(values: Record<string, any>): void;
  executeCall(): Promise<void>;
  savePreset(name: string): void;
  loadPreset(preset: ParameterPreset): void;
}
```

---

## UI Specification

### Main Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🟢 Connected: my-mcp-server v1.2.0            [Disconnect]    │
├───────────────┬─────────────────────────────────────────────────┤
│               │                                                 │
│  TOOLS (3)    │  search_web                                     │
│  ┌──────────┐ │  ─────────────────────────────────────────────  │
│  │🔍 Filter │ │                                                 │
│  ├──────────┤ │  Search the web for information                 │
│  │● search_ │ │                                                 │
│  │  web     │ │  ┌─ Parameters ──────────────────────────────┐  │
│  │  get_    │ │  │                                            │  │
│  │  weather │ │  │  query * ─────────────────────────────     │  │
│  │  send_   │ │  │  [MCP protocol specification          ]    │  │
│  │  email   │ │  │  Search query                              │  │
│  │          │ │  │                                            │  │
│  │          │ │  │  max_results ─────────────────────────     │  │
│  │          │ │  │  [5                                   ]    │  │
│  │          │ │  │  Maximum number of results (1-100)         │  │
│  │          │ │  │                                            │  │
│  │          │ │  │  [ Presets ▾ ]  [ Reset ]  [ Edit JSON ]  │  │
│  │          │ │  └────────────────────────────────────────────┘  │
│  │          │ │                                                 │
│  │          │ │  [ ▶ Execute ]  (Ctrl+Enter)                    │
│  │          │ │                                                 │
│  │          │ │  ┌─ Response (423ms, 2.1KB) ─────────────────┐  │
│  │          │ │  │  [Formatted] [Raw JSON] [Copy] [Export]   │  │
│  │          │ │  │                                            │  │
│  │          │ │  │  Here are the search results for           │  │
│  │          │ │  │  'MCP protocol specification':             │  │
│  │          │ │  │                                            │  │
│  │          │ │  │  1. Official MCP Specification - ...       │  │
│  │          │ │  │  2. MCP Protocol Guide - ...               │  │
│  │          │ │  │  3. Building MCP Servers - ...             │  │
│  │          │ │  └────────────────────────────────────────────┘  │
│  │          │ │                                                 │
│  └──────────┘ │  ┌─ History ─────────────────────────────────┐  │
│               │  │  10:30:00  search_web  423ms  ✅          │  │
│               │  │  10:29:15  get_weather  312ms  ✅          │  │
│               │  │  10:28:50  search_web  150ms  ❌          │  │
│               │  └────────────────────────────────────────────┘  │
│               │                                                 │
└───────────────┴─────────────────────────────────────────────────┘
```

### Key UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `ToolSelector` | `components/playground/tool-selector.tsx` | Sidebar list of available tools with search |
| `JsonSchemaForm` | `components/playground/json-schema-form.tsx` | Recursive JSON Schema → form renderer |
| `SchemaField` | `components/playground/schema-field.tsx` | Individual field renderer (dispatches by type) |
| `ParamForm` | `components/playground/param-form.tsx` | Wraps JsonSchemaForm with presets, reset, JSON toggle |
| `ResponseViewer` | `components/playground/response-viewer.tsx` | Formatted + raw response display |
| `ExecutionHistory` | `components/playground/execution-history.tsx` | History log with replay |
| `ResponseDiff` | `components/playground/response-diff.tsx` | Side-by-side diff of two responses |

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|---------|
| **Tool with no parameters** (`inputSchema` has empty or no `properties`) | Show "This tool requires no parameters" message. Execute button only — no form. |
| **Tool with deeply nested object schemas** (3+ levels) | Recursive form rendering with indentation and collapse/expand controls. Max depth limit of 6 to prevent infinite recursion. |
| **Tool returns very large response** (>1MB) | Truncate formatted view to first 100KB with "Show full response" button. Raw JSON view uses virtualized rendering. |
| **Tool takes very long** (>30s) | Show elapsed timer. Cancel button sends abort signal. After 60s timeout, show "Execution timed out" with option to retry with longer timeout. |
| **Tool returns streaming content** | For MVP: buffer full response, then display. Future: progressive rendering. |
| **Tool returns image content** | Render inline: `<img src="data:image/png;base64,..." />` for base64, or `<img src="...">` for URLs. |
| **Tool's `inputSchema` is invalid JSON Schema** | Fall back to raw JSON textarea input. Show warning: "This tool's parameter schema couldn't be parsed. You can enter parameters as raw JSON." |
| **Tool's `inputSchema` uses unsupported keywords** (`$ref`, complex `allOf`) | Best-effort rendering. Unhandled keywords ignored with console warning. Fall back to JSON editor for unrenderable sections. |
| **Server connection lost during execution** | Show error: "Connection to server was lost during tool execution." Offer reconnect + retry. |
| **`isError: true` in response** | Display in red error box. Still show full content (the error message from the server). Don't treat as an MCPHub error — it's a tool-level error (normal behavior). |
| **Array fields with many items** (50+) | Virtualize the array field list. Show "Add 10 more" batch button instead of individual adds. |
| **`oneOf` / `anyOf` schemas** | Render as radio group selector at the top, then show the selected variant's form. If variants aren't labeled, use "Option 1", "Option 2", etc. |
| **User submits form with `null` values for optional fields** | Strip `null` and `undefined` values from the arguments object before sending. Only send fields that have actual values. |
| **Tool name contains special characters** | URL-encode in API calls. Display as-is in the UI. |
| **Concurrent executions of the same tool** | Queue or allow parallel — show all results in history with timestamps. Don't block the form during execution. |

---

## Verification Criteria

- [ ] Selecting a tool auto-generates a form matching its `inputSchema`
- [ ] String, number, boolean, enum, array, and object types render correct form controls
- [ ] Required fields are marked and validated before submission
- [ ] Execute sends correct `tools/call` JSON-RPC message via backend
- [ ] Response displays in both formatted and raw JSON views
- [ ] Response metadata shows latency, size, and content type
- [ ] `isError: true` responses display in a distinct error style
- [ ] Image content renders inline
- [ ] Parameter presets can be saved, loaded, and deleted
- [ ] Execution history logs all calls with replay capability
- [ ] "Edit as JSON" toggle switches between form and raw JSON editor
- [ ] `Ctrl/Cmd + Enter` keyboard shortcut triggers execution
- [ ] Tool with no parameters shows execute button without form
- [ ] Tools with very large schemas render without performance degradation
- [ ] Cancel button aborts long-running tool executions

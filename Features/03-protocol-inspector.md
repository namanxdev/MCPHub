# Feature 03: Protocol Inspector

> A real-time viewer of all raw JSON-RPC messages exchanged between MCPHub and the connected MCP server — with syntax highlighting, timing, and filtering.

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

The Protocol Inspector is the **debugging backbone** of MCPHub. While the Playground shows "what the tool returned," the Inspector shows **exactly what happened at the protocol level** — every JSON-RPC message, in both directions, with byte-level accuracy.

### What It Does

1. Logs every JSON-RPC message exchanged between MCPHub's backend client and the connected MCP server
2. Streams these messages to the frontend in real-time
3. Displays them in a chronological list with:
   - **Direction:** Client → Server (request) or Server → Client (response/notification)
   - **Timestamp:** When the message was sent/received
   - **Method:** The JSON-RPC method name (`initialize`, `tools/call`, `tools/list`, etc.)
   - **Latency:** Time between a request and its correlated response (matched by JSON-RPC `id`)
   - **Payload:** The full JSON body with syntax highlighting
4. Provides filtering, searching, and export capabilities

### Analogy

The Protocol Inspector is to MCP what:
- **Chrome DevTools Network tab** is to HTTP
- **Wireshark** is to network packets
- **Postman Console** is to REST API debugging

No existing MCP tool provides this level of protocol visibility. MCP Inspector (Anthropic's tool) shows tool results but hides the underlying JSON-RPC messages.

---

## User Stories

### US-3.1: Server Developer Debugs a Failing Tool
> *As an MCP server developer, my tool returns an error but I don't know why. I want to see the exact JSON-RPC request MCPHub sent and the exact response my server returned, so I can pinpoint the issue.*

**Acceptance:** I can see the full `tools/call` request (with method, params, and id) and the full error response — both with proper JSON formatting — and identify that my server returned an invalid content type.

### US-3.2: Developer Learns MCP Protocol
> *As a developer new to MCP, I want to observe the protocol in action — the handshake, capability discovery, and tool invocation — so I can understand how it works without reading the spec.*

**Acceptance:** After connecting to a server, I see the `initialize` → `initialized` → `tools/list` sequence playing out in real-time, with full message bodies I can inspect.

### US-3.3: Performance Engineer Finds Bottleneck
> *As a performance engineer, I want to see the timing between requests and responses for each tool call, so I can identify which tools are slow and why.*

**Acceptance:** Each request-response pair shows the latency in milliseconds. I can sort by latency to find the slowest calls and inspect their payloads for clues (e.g., large response size).

### US-3.4: Developer Shares a Debug Session
> *As a developer, I want to export the full message log so I can share it with a teammate or attach it to a bug report.*

**Acceptance:** I can export all protocol messages as a JSON file that preserves timestamps, directions, payloads, and latencies.

---

## Sub-features

### SF-3.1: Message List
- Chronological list of all JSON-RPC messages
- Each row shows:
  - **Timestamp** (HH:MM:SS.mmm)
  - **Direction arrow** (→ for sent, ← for received)
  - **Method name** (e.g., `initialize`, `tools/call`, `notifications/...`)
  - **Preview** (first 80 chars of the message, truncated)
  - **Latency** (for responses: ms since the correlated request)
  - **Size** (bytes)
  - **Status icon** (✅ for success, ❌ for error, ℹ️ for notification)
- Click a row to expand and see the full message

### SF-3.2: Message Detail View
- Expanded view (panel below or sidebar) when a message row is clicked
- Full JSON payload with **syntax highlighting** (shiki or Prism.js)
- Collapsible nested objects
- Copy button (copies the full JSON)
- If this is a response: link to the correlated request (and vice versa)
- If this is an error: highlight the error code and message

### SF-3.3: Message Filtering
| Filter | Type | Options |
|--------|------|---------|
| **Direction** | Toggle buttons | All / Sent only / Received only |
| **Method** | Multi-select dropdown | `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, `prompts/get`, custom notifications |
| **Status** | Toggle buttons | All / Success / Error |
| **Search** | Text input | Full-text search within message payloads |
| **Time range** | Date-time pickers | From / To (within session) |
| **Min latency** | Number input | Only show pairs slower than X ms |

### SF-3.4: Color Coding

| Message Type | Color | Example |
|-------------|-------|---------|
| Client request (→) | Blue | `→ tools/call` |
| Server response (← success) | Green | `← tools/call result` |
| Server error response (← error) | Red | `← tools/call error` |
| Notification (no matching request) | Yellow/amber | `← notifications/tools/list_changed` |
| Initialization messages | Purple | `→ initialize`, `← initialize result` |

### SF-3.5: Auto-Scroll Toggle
- **On (default):** List auto-scrolls to the newest message as they arrive
- **Off:** User scrolls manually; a "Jump to latest" button appears when new messages arrive while scrolled up
- Toggle in the toolbar

### SF-3.6: Clear & Export
- **Clear log:** Removes all messages from the current view (with confirmation if >100 messages)
- **Export as JSON:** Downloads complete message log as a structured JSON file
- **Export as HAR-like format:** Optional structured format compatible with other tools
- **Copy single message:** From the detail view

### SF-3.7: Resend Request
- Right-click (or button) on any outbound request message
- "Resend" re-sends the exact same JSON-RPC message to the server
- Useful for reproducing intermittent issues

### SF-3.8: Message Statistics
- Collapsible stats bar at the top:
  - Total messages: 47 (23 sent, 24 received)
  - Average latency: 215ms
  - Errors: 2
  - Session duration: 5m 32s
  - Data transferred: 45.2 KB sent, 128.7 KB received

---

## Technical Implementation

### Protocol Logger (`lib/mcp/protocol-logger.ts`)

The core challenge is **intercepting all JSON-RPC messages** without modifying the MCP SDK's behavior. Approach: wrap the transport layer.

```typescript
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface ProtocolMessage {
  id: string;          // UUID for this log entry
  timestamp: number;   // Unix ms
  direction: "sent" | "received";
  raw: string;         // Raw JSON string
  parsed: JsonRpcMessage;  // Parsed JSON-RPC object
  correlationId?: number;  // JSON-RPC "id" for request-response matching
  latencyMs?: number;      // Only on responses: time since correlated request
  sizeBytes: number;       // Byte length of raw string
}

class ProtocolLogger {
  private messages: ProtocolMessage[] = [];
  private requestTimestamps: Map<number, number> = new Map(); // JSON-RPC id → timestamp
  private listeners: Set<(msg: ProtocolMessage) => void> = new Set();

  // Wraps the transport to intercept messages
  wrapTransport(transport: SSEClientTransport): SSEClientTransport {
    const originalSend = transport.send.bind(transport);
    
    transport.send = async (message: JsonRpcMessage) => {
      this.logMessage("sent", message);
      return originalSend(message);
    };

    transport.onmessage = (message: JsonRpcMessage) => {
      this.logMessage("received", message);
      // Forward to original handler
      originalOnMessage(message);
    };

    return transport;
  }

  private logMessage(direction: "sent" | "received", message: JsonRpcMessage) {
    const raw = JSON.stringify(message);
    const entry: ProtocolMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      direction,
      raw,
      parsed: message,
      sizeBytes: new TextEncoder().encode(raw).length,
    };

    // Track request-response correlation
    if (direction === "sent" && "id" in message) {
      this.requestTimestamps.set(message.id, entry.timestamp);
      entry.correlationId = message.id;
    }
    if (direction === "received" && "id" in message) {
      entry.correlationId = message.id;
      const sentAt = this.requestTimestamps.get(message.id);
      if (sentAt) {
        entry.latencyMs = entry.timestamp - sentAt;
        this.requestTimestamps.delete(message.id);
      }
    }

    this.messages.push(entry);
    
    // Notify all listeners (for SSE streaming to frontend)
    this.listeners.forEach(fn => fn(entry));
  }

  subscribe(listener: (msg: ProtocolMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMessages(): ProtocolMessage[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
    this.requestTimestamps.clear();
  }
}
```

### Streaming to Frontend: `GET /api/messages/stream`

The Protocol Inspector needs **real-time** message delivery. Use Server-Sent Events (SSE) from the Next.js API route to the browser.

**API Route:**
```typescript
// app/api/messages/stream/route.ts
export async function GET(request: Request) {
  const sessionId = request.headers.get("x-session-id");
  const connection = connectionManager.get(sessionId);
  
  if (!connection) {
    return new Response("Session not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send existing messages as initial batch
      const existing = connection.logger.getMessages();
      for (const msg of existing) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
        );
      }
      
      // Subscribe to new messages
      const unsubscribe = connection.logger.subscribe((msg) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(msg)}\n\n`)
        );
      });

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**Frontend Hook:**
```typescript
// hooks/use-protocol-messages.ts
function useProtocolMessages(sessionId: string) {
  const [messages, setMessages] = useState<ProtocolMessage[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource(
      `/api/messages/stream`,
      { headers: { "x-session-id": sessionId } }
    );
    
    eventSource.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ProtocolMessage;
      setMessages(prev => [...prev, msg]);
    };
    
    return () => eventSource.close();
  }, [sessionId]);
  
  return messages;
}
```

### Performance: Virtualized List Rendering

For sessions with hundreds or thousands of messages, rendering all DOM nodes would be expensive. Use `react-window` (or `@tanstack/react-virtual`) for virtualized rendering.

```typescript
import { FixedSizeList } from "react-window";

function MessageList({ messages }: { messages: ProtocolMessage[] }) {
  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={messages.length}
      itemSize={48}  // Each row height
    >
      {({ index, style }) => (
        <MessageRow
          key={messages[index].id}
          message={messages[index]}
          style={style}
        />
      )}
    </FixedSizeList>
  );
}
```

### Syntax Highlighting

Use `shiki` (same highlighter VS Code uses) for JSON syntax highlighting in the detail view:

```typescript
import { getHighlighter } from "shiki";

// Initialize once
const highlighter = await getHighlighter({
  themes: ["github-dark", "github-light"],
  langs: ["json"],
});

function highlightJson(json: string, theme: "dark" | "light") {
  return highlighter.codeToHtml(json, {
    lang: "json",
    theme: theme === "dark" ? "github-dark" : "github-light",
  });
}
```

### Client-Side State (Zustand Store)

```typescript
interface InspectorStore {
  // Messages
  messages: ProtocolMessage[];
  
  // Selection
  selectedMessageId: string | null;
  
  // Filters
  directionFilter: "all" | "sent" | "received";
  methodFilter: string[];       // Empty = show all
  statusFilter: "all" | "success" | "error";
  searchQuery: string;
  minLatency: number | null;
  
  // UI state
  autoScroll: boolean;
  
  // Computed
  filteredMessages: ProtocolMessage[];  // Derived from messages + filters
  statistics: MessageStatistics;        // Computed aggregates
  
  // Actions
  addMessage(msg: ProtocolMessage): void;
  selectMessage(id: string | null): void;
  setFilter(filter: Partial<FilterState>): void;
  toggleAutoScroll(): void;
  clearMessages(): void;
  exportMessages(): string;  // Returns JSON string
}
```

---

## UI Specification

### Main Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🟢 Connected: my-mcp-server v1.2.0            [Disconnect]    │
├─────────────────────────────────────────────────────────────────┤
│  Protocol Inspector                                             │
│                                                                 │
│  ┌─ Filters ──────────────────────────────────────────────────┐ │
│  │  Direction: [All] [→ Sent] [← Recv]                       │ │
│  │  Method: [All Methods ▾]  Status: [All] [✅] [❌]         │ │
│  │  Search: [________________________]  Min latency: [___]ms  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Stats: 47 messages | Avg 215ms | 2 errors | 5m 32s ──────┐ │
│                                                                 │
│  ┌─ Messages ─────────────────────────────────────────────────┐ │
│  │  TIME        DIR  METHOD          LATENCY  SIZE   STATUS   │ │
│  │  ─────────────────────────────────────────────────────────  │ │
│  │  10:24:01.02  →   initialize        —      142B    —      │ │
│  │  10:24:01.15  ←   initialize      130ms    523B    ✅      │ │
│  │  10:24:01.16  →   initialized       —       45B    —      │ │
│  │  10:24:01.20  →   tools/list        —       42B    —      │ │
│  │  10:24:01.35  ←   tools/list      150ms   1.2KB    ✅      │ │
│  │  10:24:15.00  →   tools/call        —      256B    —      │ │
│  │  10:24:15.42  ←   tools/call      423ms   2.1KB    ✅      │ │ ← selected
│  │  10:24:30.10  →   tools/call        —      198B    —      │ │
│  │  10:24:30.26  ←   tools/call      150ms    312B    ❌      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Detail: ← tools/call (response, 423ms) ──────────────────┐ │
│  │  Correlated request: → tools/call at 10:24:15.00           │ │
│  │                                                    [Copy]  │ │
│  │  {                                                         │ │
│  │    "jsonrpc": "2.0",                                       │ │
│  │    "id": 4,                                                │ │
│  │    "result": {                                             │ │
│  │      "content": [                                          │ │
│  │        {                                                   │ │
│  │          "type": "text",                                   │ │
│  │          "text": "Here are the search results..."          │ │
│  │        }                                                   │ │
│  │      ],                                                    │ │
│  │      "isError": false                                      │ │
│  │    }                                                       │ │
│  │  }                                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Clear Log]  [Export JSON]  [Auto-scroll: ON]                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `MessageList` | `components/inspector/message-list.tsx` | Virtualized list of protocol messages |
| `MessageRow` | `components/inspector/message-row.tsx` | Single message row with direction, method, latency |
| `MessageDetail` | `components/inspector/message-detail.tsx` | Expanded JSON view with syntax highlighting |
| `MessageFilters` | `components/inspector/message-filters.tsx` | Direction, method, status, search, latency filters |
| `MessageStats` | `components/inspector/message-stats.tsx` | Aggregate statistics bar |
| `InspectorToolbar` | `components/inspector/inspector-toolbar.tsx` | Clear, export, auto-scroll controls |

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|---------|
| **High-volume message streams** (100+ messages/sec) | Batch UI updates: accumulate messages in a buffer, flush to state every 100ms. Use virtualized list for DOM performance. |
| **Very large message payloads** (>100KB) | In the message list, show truncated preview. In detail view, collapse the JSON by default with a "Large message (245KB) — click to expand" notice. |
| **Malformed JSON in transport** | Display raw text with a "⚠️ Invalid JSON" badge. Don't crash — log the raw bytes. |
| **Connection drop** | Insert a synthetic "Connection Lost" event into the message timeline (styled differently — gray, dashed border). If reconnected, insert "Reconnected" event. |
| **Server-initiated notifications** (no matching request) | Display with notification icon (ℹ️). No latency column (N/A). Common MCP notifications: `notifications/tools/list_changed`, `notifications/resources/list_changed`. |
| **JSON-RPC batch requests** (array of messages) | Rare in MCP, but handle: expand each message in the batch as a separate row, grouped visually. |
| **Browser tab backgrounded** | EventSource continues receiving; messages accumulate in state. On tab re-focus, the list renders pending messages. No data loss. |
| **Session expires while inspector is open** | Show "Session expired" message in the inspector. Offer reconnect. Existing messages are preserved in client state. |
| **Messages arrive out of order** (network jitter) | Sort by timestamp. Show small reorder indicator if a message's timestamp is earlier than the previous one. |
| **Very long session** (1000+ messages) | Implement "Load more" pagination going backward. Keep the most recent 500 messages in memory; older ones archived to localStorage or disposable. |
| **Export with sensitive data** | Warn before export: "This export may contain sensitive data (API keys, auth tokens) present in the protocol messages." |
| **No messages yet** | Empty state: "No protocol messages yet. Connect to a server or invoke a tool to see messages here." |

---

## Verification Criteria

- [ ] `initialize` → response sequence appears automatically on connection
- [ ] `tools/list` messages appear when capabilities are fetched
- [ ] `tools/call` request-response pairs appear when tools are invoked from the Playground
- [ ] Each message shows timestamp, direction, method, and size
- [ ] Response messages show latency (correlated by JSON-RPC `id`)
- [ ] Clicking a message shows full JSON with syntax highlighting
- [ ] Response detail links to correlated request (and vice versa)
- [ ] Direction filter (sent/received) works correctly
- [ ] Method filter limits display to selected methods
- [ ] Text search finds matches within message payloads
- [ ] Auto-scroll follows newest messages; disabling stops scrolling
- [ ] Export produces valid JSON with all message data
- [ ] Color coding distinguishes requests, responses, errors, and notifications
- [ ] Virtualized list handles 1000+ messages without performance degradation
- [ ] Copy button on detail view copies the full JSON to clipboard
- [ ] Stats bar updates in real-time as messages arrive

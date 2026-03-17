export interface ProtocolMessage {
  id: string;
  timestamp: number;
  direction: "sent" | "received";
  raw: string;
  parsed: Record<string, unknown>;
  correlationId?: number | string;
  latencyMs?: number;
  sizeBytes: number;
  method?: string;
  isError?: boolean;
  isNotification?: boolean;
}

const MAX_MESSAGES = 1000;

export class ProtocolLogger {
  private messages: ProtocolMessage[] = [];
  private requestTimestamps: Map<number | string, number> = new Map();
  private listeners: Set<(msg: ProtocolMessage) => void> = new Set();

  logMessage(direction: "sent" | "received", raw: unknown): void {
    const rawStr = JSON.stringify(raw);
    const parsed =
      typeof raw === "object" && raw !== null
        ? (raw as Record<string, unknown>)
        : {};

    const id = parsed.id as number | string | undefined;
    const method = parsed.method as string | undefined;
    const isError = "error" in parsed;
    const isNotification = method !== undefined && id === undefined;

    const entry: ProtocolMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      direction,
      raw: rawStr,
      parsed,
      sizeBytes: new TextEncoder().encode(rawStr).length,
      method,
      isError,
      isNotification,
    };

    // Correlation tracking
    if (direction === "sent" && id !== undefined) {
      this.requestTimestamps.set(id, entry.timestamp);
      entry.correlationId = id;
    }
    if (direction === "received" && id !== undefined) {
      entry.correlationId = id;
      const sentAt = this.requestTimestamps.get(id);
      if (sentAt) {
        entry.latencyMs = entry.timestamp - sentAt;
        this.requestTimestamps.delete(id);
      }
    }

    this.messages.push(entry);
    // Ring buffer: drop oldest messages when limit exceeded
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }

    if (this.requestTimestamps.size > 500) {
      const cutoff = Date.now() - 5 * 60 * 1000;
      for (const [key, ts] of this.requestTimestamps) {
        if (ts < cutoff) this.requestTimestamps.delete(key);
      }
    }

    this.listeners.forEach((fn) => fn(entry));
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

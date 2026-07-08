import { describe, it, expect, beforeEach } from "vitest";
import { useInspectorStore } from "./inspector-store";
import type { ProtocolMessage } from "@/lib/mcp/protocol-logger";

function makeMessage(overrides: Partial<ProtocolMessage> = {}): ProtocolMessage {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    direction: "sent",
    raw: "{}",
    parsed: {},
    sizeBytes: 2,
    ...overrides,
  };
}

describe("useInspectorStore", () => {
  beforeEach(() => {
    useInspectorStore.setState({ messages: [] });
  });

  it("adds messages in order and retains correct length", () => {
    const a = makeMessage();
    const b = makeMessage();
    const c = makeMessage();

    useInspectorStore.getState().addMessage(a);
    useInspectorStore.getState().addMessage(b);
    useInspectorStore.getState().addMessage(c);

    const { messages } = useInspectorStore.getState();
    expect(messages).toHaveLength(3);
    expect(messages[0].id).toBe(a.id);
    expect(messages[1].id).toBe(b.id);
    expect(messages[2].id).toBe(c.id);
  });

  it("caps messages at MAX_MESSAGES and drops the earliest ones", () => {
    const MAX_MESSAGES = 2000;
    const total = MAX_MESSAGES + 50;

    const allMessages: ProtocolMessage[] = [];
    for (let i = 0; i < total; i++) {
      allMessages.push(makeMessage());
    }

    for (const msg of allMessages) {
      useInspectorStore.getState().addMessage(msg);
    }

    const { messages } = useInspectorStore.getState();

    // Length is capped at MAX_MESSAGES
    expect(messages).toHaveLength(MAX_MESSAGES);

    // The last message added is the last one in the array
    expect(messages[messages.length - 1].id).toBe(allMessages[total - 1].id);

    // The earliest 50 messages have been dropped
    for (let i = 0; i < 50; i++) {
      expect(messages.find((m) => m.id === allMessages[i].id)).toBeUndefined();
    }
  });
});

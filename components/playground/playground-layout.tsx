"use client";

import { ConnectForm } from "@/components/connection/connect-form";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { ConnectionHistory } from "@/components/connection/connection-history";
import { ServerCapabilities } from "@/components/connection/server-capabilities";
import { PlaygroundContent } from "@/components/playground/playground-content";
import { useConnectionStore } from "@/stores/connection-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaygroundLayout() {
  const status = useConnectionStore((s) => s.status);
  const isConnected = status === "connected";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4 h-[calc(100vh-3.5rem)]">
      {/* Top bar: status */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Playground</h1>
        <ConnectionStatus />
      </div>

      {isConnected ? (
        /* Connected layout: sidebar + main panel */
        <div className="flex gap-4 flex-1 min-h-0">
          <aside className="w-80 shrink-0 flex flex-col min-h-0">
            <ServerCapabilities />
          </aside>
          <main className="flex-1 min-h-0 border rounded-xl bg-card">
            <PlaygroundContent />
          </main>
        </div>
      ) : (
        /* Disconnected layout: connect form + history */
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
          <Card>
            <CardHeader>
              <CardTitle>Connect to an MCP Server</CardTitle>
            </CardHeader>
            <CardContent>
              <ConnectForm />
            </CardContent>
          </Card>
          <ConnectionHistory />
        </div>
      )}
    </div>
  );
}

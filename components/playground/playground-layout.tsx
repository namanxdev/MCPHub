"use client";

import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectForm } from "@/components/connection/connect-form";
import { ConnectionStatus } from "@/components/connection/connection-status";
import { ConnectionHistory } from "@/components/connection/connection-history";
import { ServerCapabilities } from "@/components/connection/server-capabilities";
import { PlaygroundContent } from "@/components/playground/playground-content";
import { useConnectionStore } from "@/stores/connection-store";
import { LineReveal } from "@/components/effects/line-reveal";
import { EASE_CINEMATIC } from "@/lib/motion";

export function PlaygroundLayout() {
  const status = useConnectionStore((s) => s.status);
  const isConnected = status === "connected";

  return (
    <div className="w-full flex flex-col h-[calc(100vh-5rem)] bg-background text-foreground border-b-2 border-foreground/10 p-0 m-0">
      {/* Top bar: status */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-foreground/10 bg-foreground/2">
        <LineReveal>
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter uppercase">Playground</h1>
        </LineReveal>
        <ConnectionStatus />
      </div>

      <AnimatePresence mode="wait">
        {isConnected ? (
          /* Connected layout: sidebar + main panel */
          <motion.div
            key="connected"
            className="flex flex-1 min-h-0 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_CINEMATIC }}
          >
            <aside className="w-75 lg:w-95 shrink-0 border-r border-foreground/10 bg-background flex flex-col h-full relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
              <ServerCapabilities />
            </aside>
            <main className="flex-1 min-h-0 bg-foreground/1 h-full overflow-hidden relative z-10">
              <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                style={{ backgroundImage: "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)", backgroundSize: "4rem 4rem" }} 
              />
              <PlaygroundContent />
            </main>
          </motion.div>
        ) : (
          /* Disconnected layout: connect form + history */
          <motion.div
            key="disconnected"
            className="flex flex-col gap-4 max-w-lg mx-auto w-full pt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: EASE_CINEMATIC }}
          >
            <div className="border border-foreground/10 bg-background shadow-xl rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-foreground" />
              <div className="border-b border-foreground/10 pb-6 mb-8">
                <h2 className="font-mono text-xl font-black uppercase tracking-widest text-foreground">Initialize Session</h2>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-2">LINK TO AN EXTERNAL MCP SERVER</p>
              </div>
              <div className="relative z-10">
                <Suspense fallback={null}>
                  <ConnectForm />
                </Suspense>
              </div>
            </div>
            <ConnectionHistory />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

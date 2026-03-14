"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResourceCard } from "@/components/connection/resource-card";
import { PromptCard } from "@/components/connection/prompt-card";
import { useConnectionStore } from "@/stores/connection-store";
import { ToolSelector } from "@/components/playground/tool-selector";

export function ServerCapabilities() {
  const session = useConnectionStore((s) => s.session);

  if (!session) return null;

  const { tools, resources, prompts } = session;

  return (
    <Tabs defaultValue="tools" className="flex flex-col h-full w-full bg-background pt-4 overflow-hidden">
      <div className="px-4 shrink-0">
        <TabsList className="flex w-full p-1 bg-foreground/10 h-11 rounded-md">
          <TabsTrigger value="tools" className="flex-1 h-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest rounded bg-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            Tools <span className="ml-1.5 opacity-60">({tools.length})</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1 h-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest rounded bg-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            Res <span className="opacity-60">({resources.length})</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex-1 h-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest rounded bg-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            Prm <span className="opacity-60">({prompts.length})</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tools" className="flex-1 min-h-0 mt-4 flex flex-col border-t border-foreground/10 bg-background m-0 focus-visible:outline-none">
        <ToolSelector />
      </TabsContent>

      <TabsContent value="resources" className="flex-1 min-h-0 mt-4 p-4 focus-visible:outline-none border-t border-foreground/10 bg-background m-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {resources.length === 0 ? (
              <p className="text-sm font-mono tracking-widest text-foreground/40 uppercase text-center mt-8">No resources</p>
            ) : (
              resources.map((resource) => (
                <ResourceCard key={resource.uri} resource={resource} />
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="prompts" className="flex-1 min-h-0 mt-4 p-4 focus-visible:outline-none border-t border-foreground/10 bg-background m-0">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {prompts.length === 0 ? (
              <p className="text-sm font-mono tracking-widest text-foreground/40 uppercase text-center mt-8">No prompts</p>
            ) : (
              prompts.map((prompt) => (
                <PromptCard key={prompt.name} prompt={prompt} />
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

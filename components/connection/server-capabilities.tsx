"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToolCard } from "@/components/connection/tool-card";
import { ResourceCard } from "@/components/connection/resource-card";
import { PromptCard } from "@/components/connection/prompt-card";
import { useConnectionStore } from "@/stores/connection-store";

export function ServerCapabilities() {
  const session = useConnectionStore((s) => s.session);

  if (!session) return null;

  const { tools, resources, prompts } = session;

  return (
    <Tabs defaultValue="tools" className="h-full flex flex-col">
      <TabsList className="shrink-0">
        <TabsTrigger value="tools">
          Tools
          <span className="ml-1 text-xs bg-background/50 rounded px-1">
            {tools.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="resources">
          Resources
          <span className="ml-1 text-xs bg-background/50 rounded px-1">
            {resources.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="prompts">
          Prompts
          <span className="ml-1 text-xs bg-background/50 rounded px-1">
            {prompts.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tools" className="flex-1 min-h-0 mt-2">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {tools.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tools available
              </p>
            ) : (
              tools.map((tool) => <ToolCard key={tool.name} tool={tool} />)
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="resources" className="flex-1 min-h-0 mt-2">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No resources available
              </p>
            ) : (
              resources.map((resource) => (
                <ResourceCard key={resource.uri} resource={resource} />
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="prompts" className="flex-1 min-h-0 mt-2">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {prompts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No prompts available
              </p>
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

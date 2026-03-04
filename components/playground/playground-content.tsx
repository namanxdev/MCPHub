"use client";

import { MousePointerClickIcon } from "lucide-react";

export function PlaygroundContent() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center py-16">
      <MousePointerClickIcon className="size-10 text-muted-foreground/50" />
      <p className="text-muted-foreground">
        Select a tool from the left panel to start testing
      </p>
    </div>
  );
}

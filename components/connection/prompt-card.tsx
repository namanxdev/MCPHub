import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Prompt } from "@/stores/connection-store";

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const args = prompt.arguments ?? [];

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="font-mono text-sm font-semibold">
          {prompt.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 flex flex-col gap-3">
        {prompt.description && (
          <p className="text-sm text-muted-foreground">{prompt.description}</p>
        )}

        {args.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Arguments
            </p>
            <div className="flex flex-col gap-1">
              {args.map((arg) => (
                <div key={arg.name} className="flex items-baseline gap-2 text-xs">
                  <code className="font-mono font-medium">{arg.name}</code>
                  {arg.required && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 h-auto"
                    >
                      required
                    </Badge>
                  )}
                  {arg.description && (
                    <span className="text-muted-foreground">
                      — {arg.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

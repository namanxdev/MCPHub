import type { Prompt } from "@/stores/connection-store";

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const args = prompt.arguments ?? [];

  return (
    <div className="border-b-2 border-foreground/10 py-6 px-6 group hover:bg-foreground/5 transition-colors duration-300">
      <div className="pb-4">
        <h3 className="font-mono text-base font-bold uppercase tracking-tight text-foreground">
          {prompt.name}
        </h3>
      </div>

      <div className="flex flex-col gap-5">
        {prompt.description && (
          <p className="text-sm font-medium text-foreground/60 leading-[1.6] max-w-[90%]">{prompt.description}</p>
        )}

        {args.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest font-mono">
              Arguments
            </p>
            <div className="flex flex-col">
              {args.map((arg) => (
                <div key={arg.name} className="flex items-baseline gap-3 text-xs border-t border-foreground/5 py-2">
                  <code className="font-mono font-bold">{arg.name}</code>
                  {arg.required && (
                    <span className="text-background bg-foreground px-1 py-[1px] text-[9px] uppercase tracking-widest">
                      REQ
                    </span>
                  )}
                  {arg.description && (
                    <span className="text-foreground/60 truncate max-w-[200px] lg:max-w-[300px]">
                      — {arg.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

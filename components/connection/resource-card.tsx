import type { Resource } from "@/stores/connection-store";

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <div className="border-b-2 border-foreground/10 py-6 px-6 group hover:bg-foreground/5 transition-colors duration-300">
      <div className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-mono text-sm font-bold tracking-tight text-foreground break-all">
            {resource.uri}
          </h3>
          {resource.mimeType && (
            <span className="flex-shrink-0 text-[9px] uppercase tracking-widest font-mono border border-foreground/20 px-1.5 py-0.5 text-foreground/60 whitespace-nowrap">
              {resource.mimeType}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {resource.name && (
          <p className="font-mono text-sm font-bold uppercase tracking-wide text-foreground">{resource.name}</p>
        )}
        {resource.description && (
          <p className="text-sm font-medium text-foreground/60 leading-[1.6] max-w-[90%]">{resource.description}</p>
        )}
      </div>
    </div>
  );
}

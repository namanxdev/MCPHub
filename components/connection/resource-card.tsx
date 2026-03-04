import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Resource } from "@/stores/connection-store";

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-sm font-semibold break-all">
            {resource.uri}
          </CardTitle>
          {resource.mimeType && (
            <Badge variant="outline" className="text-xs flex-shrink-0 font-mono">
              {resource.mimeType}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 flex flex-col gap-1">
        {resource.name && (
          <p className="text-sm font-medium">{resource.name}</p>
        )}
        {resource.description && (
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

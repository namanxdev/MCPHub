import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">MCPHub</h1>
        <p className="text-xl text-muted-foreground mb-2">Postman for MCP</p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Discover, test, debug, and monitor MCP (Model Context Protocol)
          servers. The unified platform for the MCP ecosystem.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/playground">Open Playground</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/registry">Browse Registry</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Server Connection Manager</CardTitle>
            <CardDescription>
              Connect to any MCP server via SSE or Streamable HTTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Perform the MCP protocol handshake and enumerate all tools,
              resources, and prompts exposed by any server.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interactive Tool Playground</CardTitle>
            <CardDescription>
              Auto-generated forms for every MCP tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Select a tool, fill parameters via auto-generated forms, execute,
              and see responses — all from the browser.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Protocol Inspector</CardTitle>
            <CardDescription>
              Real-time JSON-RPC message viewer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See every JSON-RPC message exchanged with the server, with timing,
              syntax highlighting, and filtering.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Health Dashboard</CardTitle>
            <CardDescription>
              Performance metrics and reliability tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track latency, error rates, and uptime for MCP servers. Per-tool
              P50/P95/P99 latency charts.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Public Registry</CardTitle>
            <CardDescription>
              Searchable directory of MCP servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse and search community-submitted MCP servers with live health
              data and one-click playground testing.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CLI Tool</CardTitle>
            <CardDescription>npx mcphub test — CI/CD ready</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Run automated health checks against MCP servers from the terminal
              or CI/CD pipelines with exit codes and JSON output.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

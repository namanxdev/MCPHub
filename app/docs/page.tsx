"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DocsSidebar, NavItem } from "@/components/docs/docs-sidebar";
import { LineReveal } from "@/components/effects/line-reveal";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, Key, Server, Play, Activity, Zap } from "lucide-react";

const NAV_ITEMS: NavItem[] = [
  { id: "intro", label: "Introduction" },
  { id: "playground", label: "Testing & Playground" },
  { id: "credentials", label: "Credentials Guide" },
  { id: "custom", label: "Custom Servers" },
  { id: "desktop-agent", label: "Desktop Agent" },
  { id: "cli", label: "CLI & Automation" },
];

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string>("intro");
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleElements = entries.filter((e) => e.isIntersecting);
        if (visibleElements.length > 0) {
          // Find the one closest to the top
          const topElement = visibleElements.reduce((prev, current) => {
            return prev.boundingClientRect.top < current.boundingClientRect.top
              ? prev
              : current;
          });
          setActiveId(topElement.target.id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );

    const elements = NAV_ITEMS.map((item) => document.getElementById(item.id));
    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row gap-12 relative min-h-screen">
      {/* Sidebar - Sticky on Desktop */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-28 bg-background/80 backdrop-blur-md p-6 border-2 border-foreground/10">
          <DocsSidebar
            items={NAV_ITEMS}
            activeId={activeId}
            onSelect={scrollTo}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0" ref={contentRef}>
        <div className="mb-16">
          <LineReveal>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter uppercase">
              Documentation
            </h1>
          </LineReveal>
          <p className="text-xl text-foreground/60 max-w-3xl leading-relaxed">
            The definitive technical guide to testing, diagnosing, and deploying Model Context Protocol (MCP) servers locally and in production.
          </p>
        </div>

        <div className="space-y-32">
          {/* Intro Section */}
          <section id="intro" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Activity className="w-6 h-6 text-foreground/50" />
              What is MCPHub?
            </h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-lg text-foreground/70 leading-relaxed">
              <p>
                MCPHub is built specifically to bridge the gap between building an MCP server and actually deploying it with confidence.
                It gives you the tools to introspect requests, check server latencies, and simulate real-world LLM calls via a <strong>Playground</strong>.
              </p>
              <Card className="mt-8 bg-foreground/5 border-foreground/10 rounded-none shadow-none">
                <CardContent className="p-6">
                  <p className="m-0 font-mono text-sm leading-relaxed text-foreground/80">
                    If you are building tools for LLMs, you need a way to test them exactly as an LLM would execute them.
                    Our UI provides a fully typed, real-time interface to list tools, compile prompts, and observe JSON-RPC streams.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Playground Section */}
          <section id="playground" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 uppercase">
              <Play className="w-6 h-6 text-foreground/50" />
              The Postman-like Client
            </h2>
            <div className="space-y-8 text-lg text-foreground/70 leading-relaxed">
              <p>
                The <strong>Playground</strong> is your primary workspace. Think of it as Postman, but specifically tailored to MCP JSON-RPC endpoints instead of REST.
              </p>
              <ul className="list-disc pl-6 space-y-4 marker:text-foreground/40">
                <li>
                  <strong className="text-foreground">Connecting:</strong> You can spin up any local command (e.g., <code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">node index.js</code>) or connect to an SSE HTTP endpoint. The Playground will instantly negotiate the protocol version and fetch server capabilities.
                </li>
                <li>
                  <strong className="text-foreground">Tool Execution:</strong> Our UI automatically generates forms based on the JSON Schema of your tools. Provide the arguments, hit "Run", and view the raw JSON-RPC response instantly. No more writing manual curl commands.
                </li>
                <li>
                  <strong className="text-foreground">Protocol Inspector:</strong> Every single payload going over the wire is captured in the <strong>Inspector</strong>. You can filter by direction, check latency (P50/P99), and instantly spot syntax errors or malformed tool definitions.
                </li>
              </ul>
            </div>
          </section>

          {/* Credentials Section */}
          <section id="credentials" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 uppercase">
              <Key className="w-6 h-6 text-foreground/50" />
              Handling Credentials
            </h2>
            <div className="text-lg text-foreground/70 leading-relaxed space-y-6">
              <p>
                Many popular MCP servers (like GitHub, Slack, or Postgres) require API keys, OAuth tokens, or database connection strings. Here is how you securely pass them into the Playground.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {[
                  {
                    title: "GitHub Server (Via mcp-proxy)",
                    desc: "Since GitHub runs locally via stdio and MCPHub is a web app, you must wrap it in an SSE server using mcp-proxy. Generate a PAT with repo permissions, then run this in a terminal:",
                    code: 'GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxx" npx -y mcp-proxy@latest --shell -- npx -y @modelcontextprotocol/server-github',
                  },
                  {
                    title: "Slack Server",
                    desc: "Obtain a Bot User OAuth Token from your Slack App dashboard. Ensure the app is installed to your workspace.",
                    code: "SLACK_BOT_TOKEN=xoxb-xxx node build/index.js",
                  },
                  {
                    title: "Postgres Server",
                    desc: "Use a standard connection string for the database server.",
                    code: "DATABASE_URL=postgres://user:pass@localhost:5432/db npx @server/postgres",
                  },
                  {
                    title: "Google Drive Server",
                    desc: "Requires a Service Account JSON key or OAuth consent screen setup depending on the implementation.",
                    code: "GOOGLE_APPLICATION_CREDENTIALS=./key.json node index.js",
                  },
                ].map((item, i) => (
                  <Card key={i} className="border-foreground/10 rounded-none shadow-none bg-background">
                    <CardContent className="p-6 flex flex-col h-full">
                      <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-foreground/60 mb-6 flex-1">{item.desc}</p>
                      <pre className="bg-foreground/5 p-3 overflow-x-auto text-[13px] font-mono text-foreground/80 border border-foreground/10">
                        {item.code}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="mt-6">
                <strong>Pro Tip:</strong> When using the Playground's Connect Form, you can add environment variables directly in the "Env Vars" section. These are injected safely before spawning the local process.
              </p>
            </div>
          </section>

          {/* Custom Servers Section */}
          <section id="custom" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 uppercase">
              <Server className="w-6 h-6 text-foreground/50" />
              Adding Custom Servers
            </h2>
            <div className="text-lg text-foreground/70 leading-relaxed space-y-6">
              <p>
                Building a custom MCP Server is straightforward using the official SDKs (TypeScript and Python).
              </p>
              <p>
                Once built, you can test it directly in MCPHub by selecting <strong>Command (Stdio)</strong> in the connection form and providing the path to your server.
              </p>
              <pre className="p-6 bg-foreground/5 border-l-4 border-foreground overflow-x-auto text-sm font-mono text-foreground/80 my-8">
                {`// Example Python Command
Command: python
Arguments: -m my_mcp_server
Environment: API_KEY=xxx`}
              </pre>
              <p>
                If your server uses HTTP/SSSE, ensure CORS is enabled and point the Playground to the correct <code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">/sse</code> endpoint.
              </p>
            </div>
          </section>

          {/* Desktop Agent Section */}
          <section id="desktop-agent" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 uppercase">
              <Zap className="w-6 h-6 text-emerald-500" />
              Desktop Agent
            </h2>
            <div className="text-lg text-foreground/70 leading-relaxed space-y-6">
              <p>
                The <strong>Desktop Agent</strong> is a small local process that bridges the cloud-deployed MCPHub to MCP servers running on your machine.
                Without it, the deployed app cannot reach <code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">localhost</code> — because
                {" "}<code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">localhost</code> on Vercel refers to Vercel's server, not yours.
              </p>

              <Card className="bg-emerald-500/5 border-emerald-500/20 rounded-none shadow-none">
                <CardContent className="p-6">
                  <p className="m-0 font-mono text-sm leading-relaxed text-foreground/80">
                    <strong className="text-emerald-500">How it works:</strong> The agent runs on your machine and listens on{" "}
                    <code className="bg-foreground/10 px-1 py-0.5 rounded">ws://localhost:54319</code>. MCPHub detects it automatically and shows a
                    green{" "}<strong>⚡ DESKTOP AGENT DETECTED</strong>{" "}banner in the connect form. Enable the toggle and all MCP traffic routes through the agent instead of Vercel.
                  </p>
                </CardContent>
              </Card>

              <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Step 1 — Install the Agent</h3>
              <p>Clone the repo and link the agent globally (one-time setup):</p>
              <pre className="p-6 bg-foreground text-background overflow-x-auto text-sm font-mono my-4">
                {`git clone https://github.com/naman/mcphub
cd mcphub/agent
npm install
npm run build
npm link          # makes mcphub-agent available globally`}
              </pre>
              <p className="text-sm text-foreground/50">
                On Windows, run the terminal as Administrator if <code className="bg-foreground/10 px-1 py-0.5 rounded text-xs">npm link</code> fails with a permissions error.
              </p>

              <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Step 2 — Start the Agent</h3>
              <pre className="p-6 bg-foreground text-background overflow-x-auto text-sm font-mono my-4">
                {`mcphub-agent start

# Custom port (optional)
mcphub-agent start --port 8888`}
              </pre>
              <p>
                You should see: <code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">🚀 MCPHub Agent listening on ws://localhost:54319</code>
              </p>

              <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Step 3 — Connect a Local Server</h3>
              <ol className="list-decimal pl-6 space-y-3 marker:text-foreground/40">
                <li>Open the <strong>Playground</strong> — the green <strong>⚡ DESKTOP AGENT DETECTED</strong> banner appears automatically when the agent is running.</li>
                <li>Enable the toggle in the banner.</li>
                <li>Enter your local server URL (e.g. <code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">http://localhost:8080/sse</code>) or switch to <strong>Command (Stdio)</strong> and type the command directly.</li>
                <li>Click <strong>INITIALIZE</strong>. The agent handles the connection on your machine.</li>
              </ol>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {[
                  {
                    title: "SSE / Streamable HTTP",
                    desc: "Use for servers you started separately that expose an HTTP endpoint.",
                    code: "http://localhost:8080/sse",
                  },
                  {
                    title: "Stdio (Command)",
                    desc: "The agent spawns the process directly on your machine. Add env vars in the form.",
                    code: "npx -y @modelcontextprotocol/server-github",
                  },
                ].map((item, i) => (
                  <Card key={i} className="border-foreground/10 rounded-none shadow-none bg-background">
                    <CardContent className="p-6 flex flex-col h-full">
                      <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-foreground/60 mb-6 flex-1">{item.desc}</p>
                      <pre className="bg-foreground/5 p-3 overflow-x-auto text-[13px] font-mono text-foreground/80 border border-foreground/10">
                        {item.code}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CLI & Automation Section */}
          <section id="cli" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 uppercase">
              <Terminal className="w-6 h-6 text-foreground/50" />
              CLI Tools & Automation
            </h2>
            <div className="text-lg text-foreground/70 leading-relaxed space-y-6">
              <p>
                While the UI is perfect for human testing, you need CLI tools for CI/CD pipelines. The official MCP organization provides a powerful inspector CLI.
              </p>
              <pre className="p-6 bg-foreground text-background overflow-x-auto text-sm font-mono my-8">
                {`# Run the official MCP Inspector
npx @modelcontextprotocol/inspector node path/to/server/index.js`}
              </pre>
              <p>
                This command launches a local process and opens a web interface that allows you to inspect messages and execute tools directly. It's the command-line equivalent of the Playground you see here.
              </p>
              <p>
                If you are creating automated tests, consider using the <code className="bg-foreground/10 px-1 py-0.5 rounded text-sm">@modelcontextprotocol/sdk</code> in your test runner (e.g., Jest or PyTest) to spawn a client instance and assert against your server's responses programmatically.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

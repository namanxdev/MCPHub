import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MCPHub",
  description: "How MCPHub handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mt-2 mb-10">
        Last updated: July 11, 2026
      </p>

      <p className="text-foreground/80 leading-relaxed mb-4">
        MCPHub is an open-source developer tool for discovering, testing, and monitoring Model
        Context Protocol (MCP) servers. This policy explains what data we handle and why.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">What we collect</h2>
      <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
        <li>
          <strong className="font-medium text-foreground">Account data.</strong> If you sign in
          with GitHub or Google, we store the basic profile your provider returns (name, email,
          avatar) to identify your account.
        </li>
        <li>
          <strong className="font-medium text-foreground">Registry submissions.</strong> Servers
          you submit to the public registry — name, description, URL, and metadata — are stored and
          displayed publicly.
        </li>
        <li>
          <strong className="font-medium text-foreground">Health &amp; usage metrics.</strong> When
          you connect to or test a server, we record protocol-level timing and error data (latency,
          tool counts, error types) to power the health dashboard. We do not store the contents of
          your tool calls.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-3">What we do not do</h2>
      <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
        <li>We do not sell your data.</li>
        <li>We do not store credentials you use to connect to third-party MCP servers.</li>
        <li>We do not track you across other sites for advertising.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-3">Third-party services</h2>
      <p className="text-foreground/80 leading-relaxed mb-4">
        MCPHub is hosted on Vercel and uses a Neon PostgreSQL database. Authentication is handled
        via GitHub and Google OAuth. Optional, privacy-friendly usage analytics may be collected by
        Vercel Web Analytics.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">Data removal</h2>
      <p className="text-foreground/80 leading-relaxed mb-4">
        You can request removal of your account or a registry submission by opening an issue on the
        project&apos;s GitHub repository.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">Contact</h2>
      <p className="text-foreground/80 leading-relaxed">
        Questions about this policy? Reach out through the project&apos;s GitHub repository.
      </p>
    </div>
  );
}

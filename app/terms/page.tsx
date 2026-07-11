import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — MCPHub",
  description: "The terms that govern your use of MCPHub.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mt-2 mb-10">
        Last updated: July 11, 2026
      </p>

      <p className="text-foreground/80 leading-relaxed mb-4">
        MCPHub is a free, open-source project provided to help developers work with Model Context
        Protocol servers. By using the hosted service you agree to these terms.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">Acceptable use</h2>
      <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
        <li>Only connect to and test MCP servers you are authorized to access.</li>
        <li>Do not use MCPHub to attack, overload, or gain unauthorized access to any system.</li>
        <li>
          Registry submissions must be accurate and must not contain malicious, illegal, or
          misleading content. We may remove submissions at our discretion.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-10 mb-3">The registry</h2>
      <p className="text-foreground/80 leading-relaxed mb-4">
        Servers listed in the public registry are submitted by the community. MCPHub does not
        endorse or guarantee any listed server. Health badges reflect automated checks and may be
        out of date. Evaluate any server before connecting real credentials to it.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">No warranty</h2>
      <p className="text-foreground/80 leading-relaxed mb-4">
        MCPHub is provided &quot;as is&quot;, without warranty of any kind, under the terms of the
        MIT License. We do not guarantee that the service will be uninterrupted, error-free, or that
        scan and health results are complete or accurate.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">Limitation of liability</h2>
      <p className="text-foreground/80 leading-relaxed mb-4">
        To the maximum extent permitted by law, the maintainers of MCPHub are not liable for any
        damages arising from your use of the service or from any MCP server you connect to through
        it.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">Changes</h2>
      <p className="text-foreground/80 leading-relaxed">
        These terms may be updated over time. Continued use of the service after changes take effect
        constitutes acceptance of the revised terms.
      </p>
    </div>
  );
}

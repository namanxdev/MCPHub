import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { SubmitForm } from "@/components/registry/submit-form";

export default function RegistrySubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/registry"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to Registry
        </Link>
        <h1 className="text-2xl font-bold">Submit a Server</h1>
        <p className="text-muted-foreground mt-1">
          Add your MCP server to the public registry. We&apos;ll attempt to connect
          and verify it automatically.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}

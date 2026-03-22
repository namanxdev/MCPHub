"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OAuthButtons } from "./oauth-buttons";

export function LoginCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign in to MCPHub</CardTitle>
        <CardDescription>
          Connect, test, and debug MCP servers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OAuthButtons />
      </CardContent>
    </Card>
  );
}

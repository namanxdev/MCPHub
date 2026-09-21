"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { getDevelopmentSession } from "@/lib/auth/development";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider session={getDevelopmentSession() ?? undefined}>
      {children}
    </NextAuthSessionProvider>
  );
}

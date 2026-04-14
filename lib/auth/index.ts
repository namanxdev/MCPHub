import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";

// `getDb()` requires DATABASE_URL which is not available at `next build` time.
// We defer the entire NextAuth initialisation to the first HTTP request by
// calling it lazily inside getInstance(). The require() inside the factory
// ensures the neon() call is never executed during module evaluation.
type AuthInstance = ReturnType<typeof NextAuth>;

let _instance: AuthInstance | null = null;

function getInstance(): AuthInstance {
  if (!_instance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getDb } = require("@/lib/db") as typeof import("@/lib/db");
    _instance = NextAuth({
      adapter: DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
      providers: [GitHub, Google],
      session: {
        strategy: "database",
      },
      pages: {
        signIn: "/login",
      },
      callbacks: {
        session({ session, user }) {
          if (session.user) {
            session.user.id = user.id;
          }
          return session;
        },
      },
    });
  }
  return _instance;
}

export const handlers: AuthInstance["handlers"] = {
  GET: (...args) => getInstance().handlers.GET(...args),
  POST: (...args) => getInstance().handlers.POST(...args),
};

// auth / signIn / signOut are overloaded — cast the inner function to `any`
// before spreading so TypeScript doesn't try to resolve the overload at the
// wrapper level; the external signature is preserved by the `as` assertion.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const auth = ((...args: any[]) => (getInstance().auth as any)(...args)) as AuthInstance["auth"];
export const signIn = ((...args: any[]) => (getInstance().signIn as any)(...args)) as AuthInstance["signIn"];
export const signOut = ((...args: any[]) => (getInstance().signOut as any)(...args)) as AuthInstance["signOut"];
/* eslint-enable @typescript-eslint/no-explicit-any */

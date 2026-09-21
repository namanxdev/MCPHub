import NextAuth, { type Session } from "next-auth";
import { getDevelopmentSession } from "./development";
import { getDb } from "../db";
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
// calling it lazily inside getInstance(). Importing the DB module is safe;
// its client is only created when getDb() is called.
type AuthInstance = ReturnType<typeof NextAuth>;

let _instance: AuthInstance | null = null;

function getInstance(): AuthInstance {
  if (!_instance) {
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
  GET: (request) => {
    const session = getDevelopmentSession();
    if (session && request.nextUrl.pathname === "/api/auth/session") {
      return Promise.resolve(Response.json(session, {
        headers: { "Cache-Control": "no-store" },
      }));
    }
    return getInstance().handlers.GET(request);
  },
  POST: (...args) => getInstance().handlers.POST(...args),
};

export async function auth(): Promise<Session | null> {
  const session = getDevelopmentSession();
  if (session) return session;
  return getInstance().auth();
}

// signIn / signOut are overloaded — cast the inner function to `any`
// before spreading so TypeScript doesn't try to resolve the overload at the
// wrapper level; the external signature is preserved by the `as` assertion.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const signIn = ((...args: any[]) => (getInstance().signIn as any)(...args)) as AuthInstance["signIn"];
export const signOut = ((...args: any[]) => (getInstance().signOut as any)(...args)) as AuthInstance["signOut"];
/* eslint-enable @typescript-eslint/no-explicit-any */

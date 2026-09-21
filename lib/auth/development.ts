import type { Session } from "next-auth";

// Never infer this from the hostname or a public environment flag: production
// requests must always use real authentication.
export function getDevelopmentSession(): Session | null {
  if (process.env.NODE_ENV !== "development") return null;

  return {
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Local Developer",
      email: "developer@localhost",
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

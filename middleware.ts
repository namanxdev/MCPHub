import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require authentication
const PROTECTED_ROUTES = [
  { path: "/api/connect", methods: ["POST"] },
  { path: "/api/disconnect", methods: ["POST"] },
  { path: "/api/tools/call", methods: ["POST"] },
  { path: "/api/registry", methods: ["POST"] },
];

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/api/auth/");
}

function isProtectedRoute(pathname: string, method: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route.path && route.methods.includes(method)
  );
}

function addCorsHeaders(
  response: NextResponse,
  origin: string,
  allowedOrigins: string[]
): NextResponse {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin || "*";
  }

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

function getAllowedOrigins(): string[] {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return [process.env.NEXT_PUBLIC_APP_URL];
  }
  if (process.env.NODE_ENV === "development") {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ];
  }
  return [];
}

export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();

  // Only handle API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // CORS preflight
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin, allowedOrigins);
  }

  // Skip auth routes — NextAuth handles them
  if (isAuthRoute(pathname)) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin, allowedOrigins);
  }

  // Protected route check
  if (isProtectedRoute(pathname, request.method)) {
    if (!request.auth?.user) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin, allowedOrigins);
    }
  }

  // Default: pass through with CORS
  const response = NextResponse.next();
  return addCorsHeaders(response, origin, allowedOrigins);
});

export const config = {
  matcher: "/api/:path*",
};

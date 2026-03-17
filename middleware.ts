import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Only apply CORS to API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = getAllowedOrigins();

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin, allowedOrigins),
    });
  }

  const response = NextResponse.next();
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

function getAllowedOrigins(): string[] {
  // In production, restrict to own domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return [process.env.NEXT_PUBLIC_APP_URL];
  }
  // In development, allow localhost on common ports
  if (process.env.NODE_ENV === "development") {
    return [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ];
  }
  return [];
}

function getCorsHeaders(origin: string, allowedOrigins: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin || "*";
  }

  return headers;
}

export const config = {
  matcher: "/api/:path*",
};

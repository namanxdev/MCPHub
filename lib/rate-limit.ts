import { NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window per key
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupTimer: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Cleanup expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  check(key: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.config.windowMs });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) this.store.delete(key);
    }
  }
}

// Pre-configured limiters for different endpoints
export const connectLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 10 });
export const toolCallLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 30 });
export const healthLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 20 });
export const streamLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 5 });
export const registrySubmitLimiter = new RateLimiter({ windowMs: 10 * 60_000, maxRequests: 5 });

// Helper to extract client IP from NextRequest
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Helper that returns a 429 Response or null
export function checkRateLimit(limiter: RateLimiter, ip: string): NextResponse | null {
  const result = limiter.check(ip);
  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((result.retryAfterMs ?? 60000) / 1000)) },
      }
    );
  }
  return null;
}

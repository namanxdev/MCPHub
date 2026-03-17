export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isPrivateIp(hostname: string): boolean {
  const h = hostname.toLowerCase();

  const privateRanges = [
    // IPv4 private / loopback / unspecified
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^0\.0\.0\.0$/,
    // IPv6 loopback
    /^::1$/,
    // IPv6 unspecified (bracket-wrapped or bare)
    /^\[::\]$/,
    // IPv6 unique-local (fc00::/7 — fc** and fd**)
    /^f[cd][0-9a-f]{0,2}:/,
    // IPv6 link-local (fe80::/10)
    /^fe80:/,
    // IPv4-mapped IPv6: ::ffff:<ipv4>
    /^::ffff:(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/,
    // Hostname-based
    /^localhost$/,
    /\.local$/,
  ];

  return privateRanges.some((r) => r.test(h));
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1"
    );
  } catch {
    return false;
  }
}

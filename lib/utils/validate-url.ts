import dns from "node:dns";
import { isPrivateIp, isLocalhostUrl } from "./index";

export type UrlValidationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

const PRIVATE_IP_ERROR =
  "Connections to private/internal IP addresses are not allowed.";

/**
 * SSRF guard for outbound URLs the server itself will connect to.
 *
 * - Requires https (except localhost when `allowLocalhost` is true)
 * - Blocks private/internal/loopback IP ranges by literal hostname
 * - Resolves DNS and re-checks the resolved address (DNS-rebinding guard)
 *
 * @param allowLocalhost When true, localhost URLs bypass the checks — used by
 *   `/api/connect` for local development. The registry submission path passes
 *   `false` because a publicly-listed server must never point at localhost or
 *   an internal address (the server, and later the cron sweep, will connect to
 *   whatever URL is stored).
 */
export async function validateOutboundUrl(
  url: string,
  { allowLocalhost = false }: { allowLocalhost?: boolean } = {}
): Promise<UrlValidationResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { ok: false, status: 400, error: "Invalid URL" };
  }

  const localhost = allowLocalhost && isLocalhostUrl(url);

  if (
    (parsedUrl.protocol !== "https:" && !localhost) ||
    (!localhost && isPrivateIp(parsedUrl.hostname))
  ) {
    return { ok: false, status: 403, error: PRIVATE_IP_ERROR };
  }

  // DNS-rebinding protection: resolve the hostname and verify the resulting IP
  // is also not private. Skipped for localhost URLs which are intentionally
  // allowed for local development.
  if (!localhost) {
    try {
      const { address } = await dns.promises.lookup(parsedUrl.hostname);
      if (isPrivateIp(address)) {
        return { ok: false, status: 403, error: PRIVATE_IP_ERROR };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("ENOTFOUND") || msg.includes("EAI_")) {
        return { ok: false, status: 400, error: "Could not resolve hostname." };
      }
      return { ok: false, status: 400, error: "Invalid URL" };
    }
  }

  return { ok: true };
}

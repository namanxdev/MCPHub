// lib/security/runner.ts
import { probeNoAuth, fetchWellKnown } from "./client.js";
import { buildFindings } from "./checks.js";
import { fingerprint, diffBaseline } from "./fingerprint.js";
import { scoreAndGrade } from "./score.js";
import { loadBaseline, saveBaseline, saveScan } from "./store.js";
import type { ScanResult } from "./types.js";

export interface RunScanOptions {
  serverId?: string | null;
  /** When false, skip DB reads/writes (ad-hoc scan with no persistence). */
  persist?: boolean;
}

export async function runScan(url: string, opts: RunScanOptions = {}): Promise<ScanResult> {
  const persist = opts.persist ?? true;
  const isHttps = url.startsWith("https://");

  const probe = await probeNoAuth(url);
  const wellKnown = probe.reachable ? await fetchWellKnown(url) : { prm: null, asm: null };

  const fps = fingerprint(probe.tools);
  const previous = persist ? await loadBaseline(url) : new Map<string, string>();
  const driftFindings = diffBaseline(fps, previous);

  const findings = buildFindings({ isHttps, probe, wellKnown, driftFindings });
  const { score, grade } = scoreAndGrade(findings);

  const result: ScanResult = {
    target: url,
    serverId: opts.serverId ?? null,
    scannedAt: new Date().toISOString(),
    score,
    grade,
    findings,
    tools: fps,
  };

  if (persist) {
    if (fps.length) await saveBaseline(url, fps);
    await saveScan(result);
  }
  return result;
}

export interface BatchRow {
  serverId: string;
  name: string;
  target: string;
  grade: string;
  score: number;
}

export async function runBatch(
  targets: { id: string; name: string; url: string }[]
): Promise<BatchRow[]> {
  const rows: BatchRow[] = [];
  for (const t of targets) {
    try {
      const r = await runScan(t.url, { serverId: t.id, persist: true });
      rows.push({ serverId: t.id, name: t.name, target: t.url, grade: r.grade, score: r.score });
    } catch {
      rows.push({ serverId: t.id, name: t.name, target: t.url, grade: "F", score: 0 });
    }
  }
  return rows;
}

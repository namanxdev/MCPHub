// lib/security/score.ts
import type { Finding, Severity } from "./types.js";

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 40, high: 20, medium: 10, low: 4, info: 0,
};

export function scoreAndGrade(findings: Finding[]): { score: number; grade: string } {
  let score = 100;
  for (const f of findings) if (f.status === "fail") score -= SEVERITY_WEIGHT[f.severity];
  score = Math.max(0, score);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
  return { score, grade };
}

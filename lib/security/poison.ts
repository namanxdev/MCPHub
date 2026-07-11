// lib/security/poison.ts
const POISON_PATTERNS: { rx: RegExp; label: string }[] = [
  { rx: /<\s*(important|secret|system|instructions?)\s*>/i, label: "hidden instruction tag" },
  { rx: /do not (tell|mention|reveal|inform)[^.]*user/i, label: "instructs model to hide action from user" },
  { rx: /before using this tool[,\s]/i, label: "prerequisite-action injection" },
  { rx: /ignore (all |any )?(previous|prior|above)/i, label: "instruction-override attempt" },
  { rx: /\.(env|ssh|aws|cursor\/mcp\.json)|id_rsa|authorized_keys|credentials/i, label: "references sensitive file/creds" },
  { rx: /(pass|send|post|forward)[^.]*(content|contents|to https?:\/\/)/i, label: "possible exfiltration directive" },
  // Astral-plane escapes REQUIRE the /u flag + \u{...} syntax, else the range
  // corrupts and matches ordinary ASCII capitals (the fixed bug).
  { rx: /[\u{200B}-\u{200F}\u{202A}-\u{202E}]|[\u{E0000}-\u{E007F}]/u, label: "invisible / bidi / tag unicode" },
];

/** Scan a tool description (and optionally its stringified schema) for poisoning signatures. */
export function scanDescription(text: string): string[] {
  const hits: string[] = [];
  for (const p of POISON_PATTERNS) if (p.rx.test(text)) hits.push(p.label);
  return hits;
}

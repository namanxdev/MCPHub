/**
 * Sanitize error messages before sending to API clients.
 * Strips file paths, stack traces, and internal details.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred";
  }

  const message = error.message;

  // Allow known safe error patterns through
  const safePatterns = [
    /timed out/i,
    /ECONNREFUSED/,
    /fetch failed/,
    /ENOENT/,
    /Command not found/,
    /Session not found/,
    /not allowed/i,
    /Invalid/i,
    /Maximum number of concurrent connections/,
    /not permitted/i,
    /spawn/i,
    /Server unreachable/i,
  ];

  for (const pattern of safePatterns) {
    if (pattern.test(message)) {
      // Strip any file paths from the message
      return message.replace(/(?:[A-Za-z]:)?(?:\/[\w.-]+)+/g, "[path]");
    }
  }

  // For unrecognized errors, return a generic message
  return "An internal error occurred";
}

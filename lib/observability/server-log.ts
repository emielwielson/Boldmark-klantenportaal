/**
 * Structured server-only logs (JSON lines) for Vercel/runtime log drains (FR-27).
 * Does not log secrets, tokens, or full property blobs. Omit PII unless LOG_PII=1.
 */

export type LogLevel = "info" | "warn" | "error";

function allowPii(): boolean {
  return process.env.LOG_PII === "1" || process.env.LOG_PII === "true";
}

export type PortalLogPayload = Record<string, unknown>;

/**
 * One JSON object per line. Uses console.error for `error`, console.warn for `warn`, else console.info.
 */
export function logPortalEvent(
  level: LogLevel,
  payload: PortalLogPayload,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: "boldmark-klantenportaal",
    level,
    ...payload,
  });

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

/** Optional email for debugging only when LOG_PII is set. */
export function maybeEmail(email: string | undefined): { email?: string } {
  if (!email) return {};
  if (allowPii()) return { email };
  return {};
}

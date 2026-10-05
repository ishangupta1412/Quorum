import { z } from 'zod';

/**
 * Red-team hardening utilities (Freebuff security delegation).
 * Shared by API routes and the ingestion parsers. Zero detection-plane impact:
 * nothing in src/detect/ may import this module.
 */

/** True byte length when the payload is transmitted as UTF-8 (Buffer-free, edge-safe). */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdfff) {
      // Surrogate pair: 4 UTF-8 bytes, one string index
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Upper bound on rejected-line retention.
 * The rejection bucket is attacker-controlled input; echoing it back unbounded
 * turns the ingest API into a log-dumping/storage-exhaustion oracle.
 */
export const MAX_REJECTION_RAW_LENGTH = 120;

export function truncateRejectionRawLine(rawLine: string): string {
  if (rawLine.length <= MAX_REJECTION_RAW_LENGTH) return rawLine;
  return `${rawLine.slice(0, MAX_REJECTION_RAW_LENGTH - 1)}…`;
}

/**
 * Spoof-resistant client identification for rate limiting.
 *
 * An attacker rotates `x-forwarded-for` per request; naive leftmost extraction
 * means the token bucket never drains and the rate limiter becomes decorative.
 * When the request has traversed the platform's trusted proxy (edge-terminated,
 * indicated by x-forwarded-host on Vercel), the RIGHTMOST xff entry is the one
 * appended by the proxy we control; otherwise xff is fully caller-controlled
 * and we fall back to dedicated edge headers only.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const edgeTerminated = request.headers.get('x-forwarded-host') !== null;

  if (xff) {
    const candidates = xff
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (candidates.length > 0) {
      return edgeTerminated ? candidates[candidates.length - 1] : candidates[0];
    }
  }

  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Credential-shaped keys that must never survive into normalization, logs, or
 * event hashes. Defense in depth: the F2 normalizer already ignores them; this
 * strips them at the schema boundary so they cannot leak via evidence bundles.
 */
const CREDENTIAL_KEYS: readonly string[] = [
  'password',
  'passwordhash',
  'pass',
  'pwd',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'sessiontoken',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
];

/**
 * Sanitizes one untrusted telemetry row (already JSON-parsed).
 * Returns a shallow copy with credential-shaped keys removed; non-objects
 * pass through untouched (they will fail normalization downstream).
 */
export function sanitizeTelemetryRow(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed;
  }
  const row: Record<string, unknown> = { ...(parsed as Record<string, unknown>) };
  for (const key of Object.keys(row)) {
    if (CREDENTIAL_KEYS.includes(key.toLowerCase())) {
      delete row[key];
    }
  }
  return row;
}

/**
 * Safely reads the first present string/number field from an untrusted row.
 * Replaces untyped `any` access after sanitization.
 */
export function readTelemetryField(
  row: unknown,
  keys: readonly string[]
): string | number | undefined {
  if (row === null || typeof row !== 'object') return undefined;
  const record = row as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') return value;
  }
  return undefined;
}

/**
 * Strict Zod schema for a single untrusted telemetry row used by schema-level
 * validation paths. Field values are length-capped; credential keys are
 * stripped before parsing.
 */
export const untrustedTelemetryRowSchema = z.object({
  timestamp: z.union([z.string().max(64), z.number()]).optional(),
  user: z.string().max(256).optional(),
  ip: z.string().max(45).optional(),
  outcome: z.string().max(64).optional(),
  source: z.string().max(128).optional(),
});

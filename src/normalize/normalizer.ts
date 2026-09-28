import { AuthEvent, AuthOutcome, IpScope } from '../types/auth-event';
import { computeEventHash } from '../lib/crypto/hash';

export interface RawAuthInput {
  rawTimestamp?: string | number | null;
  rawUser?: string | null;
  rawIp?: string | null;
  rawOutcome?: string | null;
  sourceSystem?: string | null;
  // Raw fields that must be dropped if passed
  password?: unknown;
  passwordHash?: unknown;
  token?: unknown;
  [key: string]: unknown;
}

export interface NormalizationResult {
  event?: AuthEvent;
  rejected?: {
    reasonCode: 'EMPTY_LINE' | 'UNPARSEABLE' | 'IMPLAUSIBLE_TS' | 'MISSING_SOURCE';
    details: string;
  };
}

/**
 * Checks if an IPv4 address is in RFC1918 private range or loopback.
 */
function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}

/**
 * Unwraps IPv4-mapped IPv6 addresses (e.g. ::ffff:192.0.2.1 -> 192.0.2.1)
 */
function unwrapIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.slice(7);
  }
  return trimmed;
}

/**
 * Maps arbitrary vendor outcome strings to the canonical 6-value AuthOutcome enum.
 */
function mapOutcome(rawOutcome?: string | null): AuthOutcome {
  if (!rawOutcome) return 'UNKNOWN';
  const norm = rawOutcome.trim().toUpperCase();

  if (
    norm.includes('SUCCESS') ||
    norm === 'OK' ||
    norm === 'ALLOW' ||
    norm === 'ACCEPTED' ||
    norm === '200'
  ) {
    return 'SUCCESS';
  }

  if (norm.includes('LOCKED') || norm.includes('DISABLED') || norm.includes('BLOCKED')) {
    return 'FAILURE_LOCKED';
  }

  if (norm.includes('MFA') || norm.includes('OTP') || norm.includes('CHALLENGE')) {
    return 'FAILURE_MFA';
  }

  if (norm.includes('EXPIRED')) {
    return 'FAILURE_EXPIRED';
  }

  if (
    norm.includes('FAIL') ||
    norm.includes('BAD') ||
    norm.includes('DENIED') ||
    norm.includes('INVALID') ||
    norm.includes('REJECT')
  ) {
    return 'FAILURE_BAD_CREDENTIALS';
  }

  return 'UNKNOWN';
}

/**
 * Canonicalizes username: strips domain\ and @domain.com, converts to lowercase.
 */
function canonicalizeUser(rawUser?: string | null): { userName: string; userRaw: string; userPresent: boolean } {
  if (!rawUser || rawUser.trim() === '') {
    return { userName: '__unknown__', userRaw: rawUser ?? '', userPresent: false };
  }

  const userRaw = rawUser.trim();
  let cleaned = userRaw;

  // Strip Windows NetBIOS domain: DOMAIN\username -> username
  if (cleaned.includes('\\')) {
    const parts = cleaned.split('\\');
    cleaned = parts[parts.length - 1];
  }

  // Strip UPN/Email domain: username@domain.com -> username
  if (cleaned.includes('@')) {
    const parts = cleaned.split('@');
    cleaned = parts[0];
  }

  const finalName = cleaned.toLowerCase();
  return {
    userName: finalName || '__unknown__',
    userRaw,
    userPresent: finalName !== '__unknown__' && finalName !== '',
  };
}

/**
 * Normalizes and validates raw authentication telemetry into a canonical AuthEvent.
 * Adheres strictly to F2 acceptance criteria.
 */
export function normalizeAuthEvent(
  input: RawAuthInput,
  referenceNowMs: number = Date.now()
): NormalizationResult {
  const sourceSystem = input.sourceSystem?.trim() || 'UnknownVPN';

  if (!input.rawTimestamp) {
    return { rejected: { reasonCode: 'UNPARSEABLE', details: 'Missing timestamp' } };
  }

  // Parse Timestamp & Timezone detection
  let tsStr = String(input.rawTimestamp).trim();
  let tsTzAssumed = false;

  // Check if timezone indicator (Z or +/-offset) exists
  const hasTzIndicator = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(tsStr);
  if (!hasTzIndicator) {
    tsTzAssumed = true;
    tsStr = `${tsStr}Z`; // Assume UTC
  }

  const parsedDate = new Date(tsStr);
  const tsMs = parsedDate.getTime();

  if (isNaN(tsMs)) {
    return { rejected: { reasonCode: 'UNPARSEABLE', details: `Invalid date format: ${input.rawTimestamp}` } };
  }

  // Rejection check: Timestamps before 2000-01-01 are rejected as IMPLAUSIBLE_TS
  const y2kMs = new Date('2000-01-01T00:00:00Z').getTime();
  if (tsMs < y2kMs) {
    return { rejected: { reasonCode: 'IMPLAUSIBLE_TS', details: `Timestamp prior to Y2K: ${tsStr}` } };
  }

  // Future timestamp anomaly detection (> now + 1 hour)
  let tsAnomaly: 'future' | undefined = undefined;
  if (tsMs > referenceNowMs + 3600 * 1000) {
    tsAnomaly = 'future';
  }

  const canonicalTimestamp = parsedDate.toISOString();

  // IP Handling
  const rawIp = input.rawIp?.trim() || '0.0.0.0';
  const srcIp = unwrapIp(rawIp);
  const ipScope: IpScope = isPrivateIp(srcIp) ? 'private' : 'public';

  // Username Handling
  const { userName, userRaw, userPresent } = canonicalizeUser(input.rawUser);

  // Outcome Handling
  const eventOutcome = mapOutcome(input.rawOutcome);

  // Compute canonical deterministic eventHash
  const eventHash = computeEventHash(canonicalTimestamp, userName, srcIp, eventOutcome, sourceSystem);

  const event: AuthEvent = {
    eventHash,
    timestamp: canonicalTimestamp,
    tsTzAssumed,
    ...(tsAnomaly ? { tsAnomaly } : {}),
    userName,
    userRaw,
    userPresent,
    srcIp,
    ipScope,
    eventOutcome,
    sourceSystem,
  };

  return { event };
}

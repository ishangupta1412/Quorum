import { createHash } from 'node:crypto';

/**
 * Computes deterministic SHA-256 hex string.
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Computes the unique deterministic canonical event hash for an AuthEvent.
 */
export function computeEventHash(
  timestamp: string,
  userName: string,
  srcIp: string,
  eventOutcome: string,
  sourceSystem: string
): string {
  const canonicalString = `${timestamp}|${userName.toLowerCase()}|${srcIp}|${eventOutcome}|${sourceSystem}`;
  return sha256(canonicalString);
}

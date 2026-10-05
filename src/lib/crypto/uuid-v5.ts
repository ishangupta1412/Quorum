import { sha256 } from './hash';

/**
 * RFC 4122 / RFC 9562 UUIDv5 (SHA-1 based in the spec; this build uses the
 * project's deterministic SHA-256 with the identical bit layout).
 *
 * Why UUIDv5 and not UUIDv4: STIX object identifiers must be stable across
 * repeated exports of the same incident, or downstream SIEM/TIP pipelines
 * (Sentinel, MISP, OpenCTI) would ingest the same entity as a fresh object on
 * every run. Export must be deterministic: identical Incident -> identical bundle.
 *
 * Zero external dependencies: uses src/lib/crypto/hash.ts (pure TS SHA-256).
 */

const HEX = '0123456789abcdef';

function toHex(bytes: readonly number[]): string {
  let out = '';
  for (const b of bytes) {
    out += HEX[(b >> 4) & 0xf] + HEX[b & 0xf];
  }
  return out;
}

function utf8Bytes(input: string): number[] {
  const escaped = encodeURIComponent(input);
  const bytes: number[] = [];
  for (let i = 0; i < escaped.length; i++) {
    if (escaped[i] === '%') {
      bytes.push(parseInt(escaped.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(escaped.charCodeAt(i) & 0xff);
    }
  }
  return bytes;
}

function uuidNamespaceToBytes(ns: string): number[] {
  const hex = ns.replace(/-/g, '');
  if (hex.length !== 32 || /[^0-9a-fA-F]/.test(hex)) {
    throw new Error('Invalid UUID namespace: expected 32 hex digits');
  }
  const bytes: number[] = [];
  for (let i = 0; i < 32; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Computes a deterministic UUIDv5-formatted identifier from a namespace UUID
 * and a UTF-8 name string.
 */
export function uuidV5(namespace: string, name: string): string {
  const nsBytes = uuidNamespaceToBytes(namespace);
  const nameBytes = utf8Bytes(name);
  const digestHex = sha256FromBytes(nsBytes.concat(nameBytes));
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    bytes.push(parseInt(digestHex.slice(i * 2, i * 2 + 2), 16));
  }

  // Set version (0101 = v5) and variant (10xx) bits per RFC 4122 section 4.3
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = toHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** Streaming-byte variant of the project's pure SHA-256 (single block-safe). */
function sha256FromBytes(bytes: readonly number[]): string {
  // Reuse the ASCII implementation via binary-safe octet encoding:
  // bytes are already 0-255; build a latin1 string one char per byte.
  let ascii = '';
  for (const b of bytes) {
    ascii += String.fromCharCode(b);
  }
  return sha256(ascii);
}

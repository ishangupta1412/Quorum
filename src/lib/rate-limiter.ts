// In-Memory Token-Bucket Rate Limiter for Next.js Route Handlers
// Enforces API protection against DoS and credential stuffing.
// Backed by in-memory sliding window; in multi-node clusters, back with Upstash Redis.

interface RateLimitRecord {
  tokens: number;
  lastRefillMs: number;
}

interface RateLimitConfig {
  maxTokens: number;      // Maximum burst allowance
  refillRatePerSec: number; // Refill tokens per second
}

const rateLimitBuckets = new Map<string, RateLimitRecord>();

/** Red-team hardening: unbounded distinct identifiers (IP rotation attack) must not grow the map forever. */
const MAX_BUCKETS = 10_000;

// Default configuration: 60 requests per minute burst, refilling 1 token/sec
const DEFAULT_CONFIG: RateLimitConfig = {
  maxTokens: 60,
  refillRatePerSec: 1,
};

/**
 * Checks whether an incoming client identifier (IP address, user key, or token) is rate limited.
 * Returns true if the request is permitted, false if rate limited.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remainingTokens: number; retryAfterSec?: number } {
  const now = Date.now();

  // Eviction: when an attacker rotates identifiers faster than cleanup runs,
  // cap the bucket population deterministically (oldest-refill eviction).
  if (!rateLimitBuckets.has(identifier) && rateLimitBuckets.size >= MAX_BUCKETS) {
    let oldestKey: string | null = null;
    let oldestMs = Infinity;
    for (const [key, record] of rateLimitBuckets.entries()) {
      if (record.lastRefillMs < oldestMs) {
        oldestMs = record.lastRefillMs;
        oldestKey = key;
      }
    }
    if (oldestKey !== null) {
      rateLimitBuckets.delete(oldestKey);
    }
  }

  const record = rateLimitBuckets.get(identifier);

  if (!record) {
    rateLimitBuckets.set(identifier, {
      tokens: config.maxTokens - 1,
      lastRefillMs: now,
    });
    return { allowed: true, remainingTokens: config.maxTokens - 1 };
  }

  // Calculate token refill based on elapsed time
  const elapsedSec = (now - record.lastRefillMs) / 1000;
  const replenished = Math.floor(elapsedSec * config.refillRatePerSec);
  const currentTokens = Math.min(config.maxTokens, record.tokens + replenished);

  if (replenished > 0) {
    record.lastRefillMs = now;
  }

  if (currentTokens < 1) {
    record.tokens = currentTokens;
    const retryAfterSec = Math.ceil((1 - currentTokens) / config.refillRatePerSec);
    return { allowed: false, remainingTokens: 0, retryAfterSec };
  }

  record.tokens = currentTokens - 1;
  return { allowed: true, remainingTokens: record.tokens };
}

/**
 * Observability/test hook: current live bucket population.
 * Used to assert the eviction cap bounds memory under identifier rotation.
 */
export function getRateLimitBucketCount(): number {
  return rateLimitBuckets.size;
}

/**
 * Periodically purge stale records to prevent memory leaks.
 */
export function cleanupStaleRateLimiters(maxAgeMs = 300_000): void {
  const now = Date.now();
  for (const [key, record] of rateLimitBuckets.entries()) {
    if (now - record.lastRefillMs > maxAgeMs) {
      rateLimitBuckets.delete(key);
    }
  }
}

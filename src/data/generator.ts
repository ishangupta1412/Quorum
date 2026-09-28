import { AuthEvent } from '../types/auth-event';
import { normalizeAuthEvent } from '../normalize/normalizer';

export interface GeneratorOptions {
  userCount?: number;
  pack?: 'A' | 'B';
  seed?: number;
}

export interface SyntheticDataset {
  readonly events: readonly AuthEvent[];
  readonly stats: {
    readonly benignCount: number;
    readonly attackCount: number;
    readonly totalCount: number;
    readonly compromisedUser: string;
    readonly sprayIps: readonly string[];
  };
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 */
function createRng(seed: number) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * F4: Deterministic Synthetic Dataset Generator
 * Generates realistic enterprise VPN authentication logs containing organic noise,
 * along with labeled Midnight Blizzard-style distributed password spray and pivot scenarios.
 */
export function generateSyntheticCorpus(options: GeneratorOptions = {}): SyntheticDataset {
  const seed = options.seed ?? (options.pack === 'B' ? 20260405 : 1337);
  const rng = createRng(seed);

  const baseUserCount = options.userCount ?? 150;
  const userList: string[] = [];
  for (let i = 1; i <= baseUserCount; i++) {
    userList.push(`user_${i.toString().padStart(4, '0')}`);
  }

  const events: AuthEvent[] = [];
  const baseTimeMs = new Date('2026-09-28T08:00:00Z').getTime();

  // 1. Generate Benign Traffic
  let benignCount = 0;
  for (let u = 0; u < userList.length; u++) {
    const user = userList[u];
    const ip = `198.51.100.${(u % 200) + 1}`;
    // 2-4 successful logins per user over 3 days
    const logins = Math.floor(rng() * 3) + 2;

    for (let k = 0; k < logins; k++) {
      const offsetMs = Math.floor(rng() * 72 * 3600 * 1000);
      const isTypo = rng() < 0.025; // 2.5% organic typo rate
      const outcome = isTypo ? 'FAILURE_BAD_CREDENTIALS' : 'SUCCESS';

      const norm = normalizeAuthEvent({
        rawTimestamp: new Date(baseTimeMs + offsetMs).toISOString(),
        rawUser: user,
        rawIp: ip,
        rawOutcome: outcome,
        sourceSystem: 'CiscoAnyConnect',
      });

      if (norm.event) {
        events.push(norm.event);
        benignCount++;
      }
    }
  }

  // 2. Inject Flagship Attack: Distributed Password Spray (Midnight Blizzard style)
  // 12 proxy IPs, 35 distinct targeted accounts, each IP touches 3-4 accounts
  const sprayIps: string[] = [];
  for (let i = 1; i <= 12; i++) {
    sprayIps.push(`203.0.113.${10 + i}`);
  }

  const targetedAccounts = userList.slice(0, 35);
  let attackCount = 0;

  for (let ipIdx = 0; ipIdx < sprayIps.length; ipIdx++) {
    const ip = sprayIps[ipIdx];
    // Each IP sprays 3 accounts
    for (let a = 0; a < 3; a++) {
      const userIndex = (ipIdx * 2 + a) % targetedAccounts.length;
      const targetUser = targetedAccounts[userIndex];
      const sprayOffsetMs = 24 * 3600 * 1000 + (ipIdx * 300 + a * 60) * 1000;

      const norm = normalizeAuthEvent({
        rawTimestamp: new Date(baseTimeMs + sprayOffsetMs).toISOString(),
        rawUser: targetUser,
        rawIp: ip,
        rawOutcome: 'FAILURE_BAD_CREDENTIALS',
        sourceSystem: 'CiscoAnyConnect',
      });

      if (norm.event) {
        events.push(norm.event);
        attackCount++;
      }
    }
  }

  // 3. Inject Climax: Post-Spray Pivot (F10)
  // Target user_0001 is compromised via residential IP 203.0.113.11 with a SUCCESS login!
  const compromisedUser = targetedAccounts[0];
  const pivotTimeMs = baseTimeMs + 28 * 3600 * 1000;
  const pivotEvent = normalizeAuthEvent({
    rawTimestamp: new Date(pivotTimeMs).toISOString(),
    rawUser: compromisedUser,
    rawIp: '203.0.113.11',
    rawOutcome: 'SUCCESS',
    sourceSystem: 'CiscoAnyConnect',
  });

  if (pivotEvent.event) {
    events.push(pivotEvent.event);
    attackCount++;
  }

  // 4. Inject Localized Brute Force (F5 comparison) on user_0099
  const bruteUser = userList[userList.length - 1];
  const bruteIp = '198.51.100.99';
  for (let b = 0; b < 6; b++) {
    const bEvent = normalizeAuthEvent({
      rawTimestamp: new Date(baseTimeMs + 3600 * 1000 + b * 60 * 1000).toISOString(),
      rawUser: bruteUser,
      rawIp: bruteIp,
      rawOutcome: 'FAILURE_BAD_CREDENTIALS',
      sourceSystem: 'CiscoAnyConnect',
    });
    if (bEvent.event) {
      events.push(bEvent.event);
      attackCount++;
    }
  }

  // Sort chronologically
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    events,
    stats: {
      benignCount,
      attackCount,
      totalCount: events.length,
      compromisedUser,
      sprayIps,
    },
  };
}

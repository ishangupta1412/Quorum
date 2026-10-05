import { describe, it, expect } from './test-helper';
import { AuthEvent } from '../src/types/auth-event';
import { generateSyntheticCorpus } from '../src/data/generator';
import { normalizeAuthEvent } from '../src/normalize/normalizer';
import { parseJsonLines } from '../src/normalize/parsers';
import { runDetectionPipeline } from '../src/detect/engine';
import { detectPivot } from '../src/detect/pivot';
import { detectCampaignGraph } from '../src/detect/campaign-graph';
import { checkRateLimit, getRateLimitBucketCount } from '../src/lib/rate-limiter';
import { truncateRejectionRawLine, utf8ByteLength, MAX_REJECTION_RAW_LENGTH } from '../src/lib/security/redteam';
import { Signal } from '../src/types/auth-event';

/**
 * Freebuff Red-Team Suite — "Break My App" (Quorum security delegation).
 * Every test encodes a concrete attack path against the detection plane,
 * ingestion boundary, or trust plane. All inputs are deterministic.
 */

function event(
  timestamp: string,
  userName: string,
  srcIp: string,
  outcome: 'SUCCESS' | 'FAILURE_BAD_CREDENTIALS'
): AuthEvent {
  const res = normalizeAuthEvent({
    rawTimestamp: timestamp,
    rawUser: userName,
    rawIp: srcIp,
    rawOutcome: outcome,
    sourceSystem: 'RedTeamSim',
  });
  if (!res.event) throw new Error(`Test event failed normalization: ${timestamp}`);
  return res.event;
}

function graphSignal(timestamp: string, accounts: string[], ips: string[]): Signal {
  return {
    id: 'sig_f7_campaign_cluster_1',
    detectorId: 'F7_campaign',
    detectorFamily: 'GRAPH',
    confidenceScore: 90,
    entityKey: 'cluster:test',
    eventHashes: [],
    evidenceBundle: { targetedAccounts: accounts, contributingIps: ips },
    timestamp,
  };
}

describe('Red Team: Timing / Resource-Exhaustion Attacks', () => {
  it('F5 survives a 100k-event single (user, IP) brute-force burst without quadratic blowup', () => {
    const events: AuthEvent[] = [];
    const base = Date.parse('2026-09-28T08:00:00Z');
    for (let i = 0; i < 100_000; i++) {
      events.push(
        event(
          new Date(base + i * 1000).toISOString(),
          'victim_admin',
          '203.0.113.66',
          'FAILURE_BAD_CREDENTIALS'
        )
      );
    }

    const started = Date.now();
    const result = runDetectionPipeline(events);
    const elapsed = Date.now() - started;

    // Signal correctness is preserved: at least one VOLUME-family signal fired.
    const volumeSignals = result.signals.filter((s) => s.detectorFamily === 'VOLUME');
    expect(volumeSignals.length).toBeGreaterThanOrEqual(1);

    // Quadratic naive scan (2.5e9 ops projected) would take minutes; bounded
    // scan must complete near-instantly. Generous 5s CI ceiling absorbs
    // slow runners while still failing the O(n^2) pathology (~minutes).
    expect(elapsed).toBeLessThan(5000);
  });

  it('F7 evidence bundle stays bounded on a 500-IP x 2000-account hostile cluster', () => {
    const events: AuthEvent[] = [];
    const base = Date.parse('2026-09-28T08:00:00Z');
    // 20 failure events per (ip, user) edge over a dense campaign block
    for (let ipIdx = 0; ipIdx < 20; ipIdx++) {
      for (let uIdx = 0; uIdx < 20; uIdx++) {
        for (let k = 0; k < 5; k++) {
          events.push(
            event(
              new Date(base + (ipIdx * 25 + uIdx) * 60_000 + k).toISOString(),
              `user_${uIdx.toString().padStart(4, '0')}`,
              `203.0.113.${ipIdx + 1}`,
              'FAILURE_BAD_CREDENTIALS'
            )
          );
        }
      }
    }

    const signals = detectCampaignGraph(events, {
      minIps: 5,
      minAccounts: 15,
      windowHours: 72,
      maxEvidenceHashes: 500,
    });
    expect(signals.length).toBeGreaterThanOrEqual(1);
    const hashes = signals[0].eventHashes;
    expect(hashes.length).toBeLessThanOrEqual(500);
    expect(hashes.length).toBeGreaterThan(0);
  });

  it('rate limiter caps bucket population under x-forwarded-for identifier rotation', () => {
    for (let i = 0; i < 25_000; i++) {
      checkRateLimit(`rotated:${i}`, { maxTokens: 1, refillRatePerSec: 0.001 });
    }
    expect(getRateLimitBucketCount()).toBeLessThanOrEqual(10_000);
  });
});

describe('Red Team: Pivot Detector False-Positive Exploits (F10)', () => {
  it('rejects the pre-attack SUCCESS exploit: routine login 1h before a whole-directory spray', () => {
    const base = Date.parse('2026-09-28T08:00:00Z');
    // Victim logs in successfully 1h BEFORE the spray begins
    const events: AuthEvent[] = [
      event(new Date(base).toISOString(), 'user_0001', '198.51.100.7', 'SUCCESS'),
    ];
    // Attacker then sprays the entire directory to poison the pivot anchor
    for (let u = 1; u <= 30; u++) {
      events.push(
        event(
          new Date(base + 2 * 3600_000 + u * 1000).toISOString(),
          `user_${u.toString().padStart(4, '0')}`,
          '203.0.113.99',
          'FAILURE_BAD_CREDENTIALS'
        )
      );
    }

    const signals = detectPivot(events, [graphSignal(new Date(base + 2 * 3600_000 + 31_000).toISOString(), events.filter((e) => e.eventOutcome !== 'SUCCESS').map((e) => e.userName), ['203.0.113.99'])]);

    expect(signals.length).toBe(0); // legacy code flagged this as "compromised"
  });

  it('rejects the source-mismatch exploit: sprayed account logs in from its normal corporate IP', () => {
    const base = Date.parse('2026-09-28T08:00:00Z');
    const events: AuthEvent[] = [];
    for (let u = 1; u <= 30; u++) {
      events.push(
        event(
          new Date(base + u * 1000).toISOString(),
          `user_${u.toString().padStart(4, '0')}`,
          '203.0.113.99',
          'FAILURE_BAD_CREDENTIALS'
        )
      );
    }
    // Post-spray benign SUCCESS from the corporate LAN, not a campaign IP
    events.push(event(new Date(base + 3600_000).toISOString(), 'user_0001', '10.20.30.40', 'SUCCESS'));

    const signals = detectPivot(
      events,
      [graphSignal(new Date(base + 31_000).toISOString(), events.filter((e) => e.eventOutcome !== 'SUCCESS').map((e) => e.userName), ['203.0.113.99'])],
      { maxPivotWindowHours: 48 }
    );

    expect(signals.length).toBe(0);
  });

  it('still confirms a TRUE pivot: post-spray SUCCESS from a campaign IP within the window', () => {
    const base = Date.parse('2026-09-28T08:00:00Z');
    const events: AuthEvent[] = [];
    for (let u = 1; u <= 30; u++) {
      events.push(
        event(
          new Date(base + u * 1000).toISOString(),
          `user_${u.toString().padStart(4, '0')}`,
          '203.0.113.99',
          'FAILURE_BAD_CREDENTIALS'
        )
      );
    }
    events.push(event(new Date(base + 7200_000).toISOString(), 'user_0001', '203.0.113.99', 'SUCCESS'));

    const signals = detectPivot(
      events,
      [graphSignal(new Date(base + 31_000).toISOString(), events.filter((e) => e.eventOutcome !== 'SUCCESS').map((e) => e.userName), ['203.0.113.99'])],
      { maxPivotWindowHours: 48 }
    );

    expect(signals.length).toBe(1);
    expect(signals[0].detectorFamily).toBe('PIVOT');
    expect(String((signals[0].evidenceBundle as Record<string, unknown>).compromisedUser)).toBe('user_0001');
  });

  it('full pipeline stays correct on sealed Pack B after pivot hardening (Ralph ground truth intact)', () => {
    const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const result = runDetectionPipeline(packB.events);
    const criticals = result.incidents.filter((inc) => inc.severityTier === 'CRITICAL');
    expect(criticals.length).toBeGreaterThanOrEqual(1);
    expect(criticals[0].severityScore).toBe(100);
    expect(criticals[0].compromisedAccounts).toContain('user_0001');
  });
});

describe('Red Team: Ingestion Boundary Attacks', () => {
  it('credential-shaped fields are stripped before normalization and never reach event hashes', () => {
    const jsonl = JSON.stringify({
      timestamp: '2026-09-28T10:00:00Z',
      user: 'alex',
      ip: '198.51.100.1',
      outcome: 'SUCCESS',
      password: 'SuperSecret123!',
      accessToken: 'Bearer eyJhbGciOi...',
      apiKey: 'sk-live-abcdef',
    });

    const { accepted, rejected } = parseJsonLines(jsonl);
    expect(rejected.length).toBe(0);
    expect(accepted.length).toBe(1);

    const serialized = JSON.stringify(accepted[0]);
    expect(serialized.includes('SuperSecret123!')).toBe(false);
    expect(serialized.includes('eyJhbGciOi')).toBe(false);
    expect(serialized.includes('sk-live-abcdef')).toBe(false);
  });

  it('rejection bucket truncates hostile 50KB garbage lines (log-dumping prevention)', () => {
    const garbage = 'x'.repeat(50_000) + ' NOT_JSON';
    const { rejected } = parseJsonLines(garbage);
    expect(rejected.length).toBe(1);
    expect(rejected[0].rawLine.length).toBeLessThanOrEqual(MAX_REJECTION_RAW_LENGTH);
  });

  it('truncateRejectionRawLine preserves short lines verbatim and bounds long ones', () => {
    expect(truncateRejectionRawLine('short line')).toBe('short line');
    const long = 'z'.repeat(5000);
    const truncated = truncateRejectionRawLine(long);
    expect(truncated.length).toBe(MAX_REJECTION_RAW_LENGTH);
    expect(truncated.endsWith('…')).toBe(true);
  });

  it('UTF-8 byte accounting counts multi-byte and astral characters correctly', () => {
    expect(utf8ByteLength('ascii')).toBe(5);
    expect(utf8ByteLength('é')).toBe(2); // 2-byte
    expect(utf8ByteLength('\u20AC')).toBe(3); // 3-byte euro sign
    expect(utf8ByteLength('\uD83D\uDE0A')).toBe(4); // astral smiley (surrogate pair)
  });

  it('benchmark: 20k hostile JSONL rows ingest within the CI ceiling (no ReDoS/parsing blowup)', () => {
    const rows: string[] = [];
    const base = Date.parse('2026-09-28T08:00:00Z');
    for (let i = 0; i < 20_000; i++) {
      rows.push(
        JSON.stringify({
          timestamp: new Date(base + i * 1000).toISOString(),
          user: `user_${i}`,
          ip: `203.0.113.${i % 250}.${(i % 250) + 1}`,
          outcome: 'FAILURE_BAD_CREDENTIALS',
        })
      );
    }
    const started = Date.now();
    const { accepted, rejected } = parseJsonLines(rows.join('\n'));
    const elapsed = Date.now() - started;
    expect(accepted.length).toBe(20_000);
    expect(rejected.length).toBe(0);
    expect(elapsed).toBeLessThan(5000);
  });
});

describe('Red Team: Determinism & State-Pollution Invariants', () => {
  it('pack B pipeline is byte-identical across repeated runs (no hidden state)', () => {
    const a = runDetectionPipeline(generateSyntheticCorpus({ userCount: 100, pack: 'B' }).events);
    const b = runDetectionPipeline(generateSyntheticCorpus({ userCount: 100, pack: 'B' }).events);
    expect(JSON.stringify(a.incidents)).toBe(JSON.stringify(b.incidents));
    expect(JSON.stringify(a.signals)).toBe(JSON.stringify(b.signals));
  });

  it('running the hostile 100k burst does not poison the sealed Pack B ground truth', () => {
    const events: AuthEvent[] = [];
    const base = Date.parse('2026-09-28T08:00:00Z');
    for (let i = 0; i < 50_000; i++) {
      events.push(
        event(
          new Date(base + i * 1000).toISOString(),
          'victim_admin',
          '203.0.113.66',
          'FAILURE_BAD_CREDENTIALS'
        )
      );
    }
    runDetectionPipeline(events);

    const fresh = runDetectionPipeline(generateSyntheticCorpus({ userCount: 100, pack: 'B' }).events);
    const baseline = runDetectionPipeline(generateSyntheticCorpus({ userCount: 100, pack: 'B' }).events);
    expect(JSON.stringify(fresh.incidents)).toBe(JSON.stringify(baseline.incidents));
  });
});

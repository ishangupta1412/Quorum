import { describe, it, expect } from './test-helper';
import { Incident } from '../src/types/auth-event';
import { exportToStix21, validateStixBundle, StixBundle } from '../src/lib/export/stix';
import { exportToSentinel, validateSentinelPayload } from '../src/lib/export/sentinel';

/**
 * F25A/F25B Exporter Validation Suite (Freebuff security delegation).
 * Asserts STIX 2.1 and Microsoft Sentinel payloads are structurally valid,
 * deterministic, and hostile-input resistant.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: 'inc_quorum_correlated_01',
    title: 'Distributed Password Spray with Confirmed Account Compromise (1 account)',
    severityScore: 100,
    severityTier: 'CRITICAL',
    severityEquation: 'Base 100 (F10_pivot) × 1.00 (2 families: GRAPH, PIVOT) + 15 (auth success) → 100 [CRITICAL]',
    familiesPresent: ['GRAPH', 'PIVOT'],
    signalIds: ['sig_f7_campaign_cluster_1', 'sig_f10_pivot_user_0001_1'],
    contributingIps: ['203.0.113.11', '203.0.113.12', '203.0.113.13'],
    targetedAccounts: ['user_0001', 'user_0002', 'user_0003'],
    compromisedAccounts: ['user_0001'],
    status: 'OPEN',
    createdAt: '2026-09-28T12:00:00.000Z',
    ...overrides,
  };
}

describe('F25B STIX 2.1 Bundle Exporter', () => {
  it('produces a structurally valid bundle per validateStixBundle', () => {
    const bundle = exportToStix21(makeIncident());
    const result = validateStixBundle(bundle);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('uses type--UUID object ids with UUIDv5 determinism (identical incident → identical ids)', () => {
    const incident = makeIncident();
    const a = exportToStix21(incident);
    const b = exportToStix21(incident);

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const obj of a.objects) {
      const id = String(obj.id);
      expect(id.startsWith(`${String(obj.type)}--`)).toBe(true);
      expect(UUID_RE.test(id.split('--')[1])).toBe(true);
    }
  });

  it('rejects invalid SCOs through the validator (missing value, bad pattern)', () => {
    const broken = {
      type: 'bundle',
      id: 'bundle--f47ac10b-58cc-4372-a567-0e02b2c3d479',
      objects: [
        { type: 'ipv4-addr', spec_version: '2.1', id: 'ipv4-addr--f47ac10b-58cc-4372-a567-0e02b2c3d479' },
        {
          type: 'indicator',
          spec_version: '2.1',
          id: 'indicator--f47ac10b-58cc-4372-a567-0e02b2c3d479',
          created: '2026-09-28T12:00:00.000Z',
          modified: '2026-09-28T12:00:00.000Z',
          pattern_type: 'stix',
          pattern: 'not-a-pattern',
        },
      ],
    } as unknown as StixBundle;

    const result = validateStixBundle(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('detects duplicate object ids and type/id mismatches', () => {
    const broken = {
      type: 'bundle',
      id: 'bundle--f47ac10b-58cc-4372-a567-0e02b2c3d479',
      objects: [
        { type: 'identity', spec_version: '2.1', id: 'identity--f47ac10b-58cc-4372-a567-0e02b2c3d479', created: '2026-01-01T00:00:00.000Z', modified: '2026-01-01T00:00:00.000Z' },
        { type: 'indicator', spec_version: '2.1', id: 'identity--f47ac10b-58cc-4372-a567-0e02b2c3d479', created: '2026-01-01T00:00:00.000Z', modified: '2026-01-01T00:00:00.000Z', pattern_type: 'stix', pattern: '[a]' },
      ],
    } as unknown as StixBundle;

    const result = validateStixBundle(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('format'))).toBe(true);
  });

  it('bounds the STIX pattern to 100 values and keeps SCO ids stable per IP', () => {
    const ips: string[] = [];
    for (let i = 0; i < 150; i++) ips.push(`203.0.113.${i + 1}`);
    const incident = makeIncident({ contributingIps: ips });

    const bundle = exportToStix21(incident);
    const indicator = bundle.objects.find((o) => o.type === 'indicator');
    const pattern = String(indicator?.pattern);
    expect(pattern.includes('203.0.113.101')).toBe(false); // capped at 100
    expect(pattern.includes('203.0.113.99')).toBe(true);

    const sco = bundle.objects.find((o) => o.type === 'ipv4-addr' && o.value === '203.0.113.11');
    const bundle2 = exportToStix21(makeIncident({ contributingIps: ['203.0.113.11'] }));
    const sco2 = bundle2.objects.find((o) => o.type === 'ipv4-addr' && o.value === '203.0.113.11');
    expect(String(sco?.id)).toBe(String(sco2?.id)); // deterministic UUIDv5 from IP value
  });

  it('escapes hostile single quotes in STIX pattern values (pattern injection)', () => {
    const incident = makeIncident({ contributingIps: ["203.0.113.11', 'evil.example.com"] });
    const bundle = exportToStix21(incident);
    const result = validateStixBundle(bundle);
    expect(result.valid).toBe(true);
    const pattern = String(bundle.objects.find((o) => o.type === 'indicator')?.pattern);
    // Every embedded quote must be backslash-escaped so the hostile value
    // stays ONE pattern value instead of breaking out into a new value.
    // (The wrapper's own closing quote is the only unescaped trailing quote.)
    expect(pattern.includes("', '")).toBe(false);
    expect(pattern.includes("\\'")).toBe(true);
  });
});

describe('F25A Microsoft Sentinel Exporter', () => {
  it('produces a valid ARM incident payload for the flagship CRITICAL incident', () => {
    const payload = exportToSentinel(makeIncident());
    const result = validateSentinelPayload(payload);
    expect(result.valid).toBe(true);
    expect(payload.properties.severity).toBe('High'); // Sentinel caps at High
    expect(payload.properties.classification).toBe('TruePositive');
    expect(payload.properties.techniques).toContain('T1110.003');
  });

  it('rejects malformed technique ids and empty tactics through the validator', () => {
    const payload = exportToSentinel(makeIncident());
    payload.properties.techniques = ['NOT_A_TECHNIQUE'];
    payload.properties.tactics = [];
    const result = validateSentinelPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('T1110'))).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('clamps hostile oversized titles/descriptions to governed limits', () => {
    const hostile = 'A'.repeat(50_000);
    const payload = exportToSentinel(makeIncident({ title: hostile }));
    expect(payload.properties.title.length).toBeLessThanOrEqual(256);
    expect(validateSentinelPayload(payload).valid).toBe(true);
  });

  it('keeps classification Undetermined when no account is confirmed compromised', () => {
    const payload = exportToSentinel(makeIncident({ compromisedAccounts: [] }));
    expect(payload.properties.classification).toBe('Undetermined');
    expect(validateSentinelPayload(payload).valid).toBe(true);
  });
});

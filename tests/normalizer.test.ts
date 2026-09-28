import { describe, it, expect } from './test-helper';
import { normalizeAuthEvent } from '../src/normalize/normalizer';

describe('F2 Canonical AuthEvent Normalizer', () => {
  it('maps raw outcomes strictly to the 6-value enum and falls back to UNKNOWN', () => {
    const successRes = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '198.51.100.1',
      rawOutcome: 'OK',
    });
    expect(successRes.event?.eventOutcome).toBe('SUCCESS');

    const lockRes = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '198.51.100.1',
      rawOutcome: 'ACCOUNT_LOCKED_OUT',
    });
    expect(lockRes.event?.eventOutcome).toBe('FAILURE_LOCKED');

    const unknownRes = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '198.51.100.1',
      rawOutcome: 'RANDOM_VENDOR_CODE_99',
    });
    expect(unknownRes.event?.eventOutcome).toBe('UNKNOWN');
  });

  it('assumes UTC when timezone is missing and sets tsTzAssumed = true', () => {
    const res = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00',
      rawUser: 'alex',
      rawIp: '198.51.100.1',
      rawOutcome: 'SUCCESS',
    });
    expect(res.event?.tsTzAssumed).toBe(true);
    expect(res.event?.timestamp).toBe('2026-09-28T10:00:00.000Z');
  });

  it('unwraps IPv4-mapped IPv6 addresses', () => {
    const res = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '::ffff:192.0.2.1',
      rawOutcome: 'SUCCESS',
    });
    expect(res.event?.srcIp).toBe('192.0.2.1');
  });

  it('tags RFC1918 private IPs as private', () => {
    const resPrivate = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '10.20.30.40',
      rawOutcome: 'SUCCESS',
    });
    expect(resPrivate.event?.ipScope).toBe('private');

    const resPublic = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '198.51.100.40',
      rawOutcome: 'SUCCESS',
    });
    expect(resPublic.event?.ipScope).toBe('public');
  });

  it('canonicalizes usernames by stripping NetBIOS domain and UPN', () => {
    const resNetbios = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'CONTOSO\\John.Doe',
      rawIp: '198.51.100.1',
      rawOutcome: 'SUCCESS',
    });
    expect(resNetbios.event?.userName).toBe('john.doe');
    expect(resNetbios.event?.userRaw).toBe('CONTOSO\\John.Doe');

    const resUpn = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'Jane.Smith@contoso.com',
      rawIp: '198.51.100.1',
      rawOutcome: 'SUCCESS',
    });
    expect(resUpn.event?.userName).toBe('jane.smith');
  });

  it('rejects timestamps prior to year 2000 as IMPLAUSIBLE_TS', () => {
    const res = normalizeAuthEvent({
      rawTimestamp: '1999-12-31T23:59:59Z',
      rawUser: 'alex',
      rawIp: '198.51.100.1',
      rawOutcome: 'SUCCESS',
    });
    expect(res.event).toBeUndefined();
    expect(res.rejected?.reasonCode).toBe('IMPLAUSIBLE_TS');
  });

  it('drops raw passwords or credentials without persisting them', () => {
    const res = normalizeAuthEvent({
      rawTimestamp: '2026-09-28T10:00:00Z',
      rawUser: 'alex',
      rawIp: '198.51.100.1',
      rawOutcome: 'SUCCESS',
      password: 'SuperSecretPassword123!',
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(res.event).toBeDefined();
    expect((res.event as any).password).toBeUndefined();
    expect((res.event as any).passwordHash).toBeUndefined();
  });
});

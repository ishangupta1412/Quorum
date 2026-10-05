import { describe, it, expect } from './test-helper';
import { generateSyntheticCorpus } from '../src/data/generator';
import { runDetectionPipeline } from '../src/detect/engine';
import { exportToSentinel } from '../src/lib/export/sentinel';
import {
  parseWebhookPayload,
  createWebhookReceipt,
} from '../src/lib/sentinel/webhook';

function buildValidBody() {
  const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
  const result = runDetectionPipeline(packB.events);
  const primary =
    result.incidents.find((i) => i.severityTier === 'CRITICAL') || result.incidents[0];
  return { incident: exportToSentinel(primary) };
}

describe('Plan 5.3 Sentinel Webhook Streaming (strict Zod validation)', () => {
  it('accepts a Quorum-exported Sentinel incident payload', () => {
    const parsed = parseWebhookPayload(buildValidBody());
    expect(parsed.ok).toBe(true);
    expect(parsed.body).toBeDefined();
  });

  it('rejects malformed payloads with structured issues', () => {
    expect(parseWebhookPayload({}).ok).toBe(false);
    expect(parseWebhookPayload({ incident: { name: 'x' } }).ok).toBe(false);
    expect(
      parseWebhookPayload({ incident: buildValidBody().incident, extra: 1 }).ok
    ).toBe(false);
  });

  it('rejects wrong severity enum and wrong incident type', () => {
    const body = buildValidBody();
    const badSeverity = JSON.parse(JSON.stringify(body));
    badSeverity.incident.properties.severity = 'Critical';
    expect(parseWebhookPayload(badSeverity).ok).toBe(false);

    const badType = JSON.parse(JSON.stringify(body));
    badType.incident.type = 'Something/Else';
    expect(parseWebhookPayload(badType).ok).toBe(false);
  });

  it('issues deterministic receipts idempotent on incident name', () => {
    const body = buildValidBody();
    const parsed = parseWebhookPayload(body);
    if (!parsed.ok || !parsed.body) {
      throw new Error('Expected valid webhook body');
    }
    const first = createWebhookReceipt(parsed.body, '2026-09-30T00:00:00.000Z');
    const second = createWebhookReceipt(parsed.body, '2026-09-30T00:00:00.000Z');
    expect(first.receiptId).toBe(second.receiptId);
    expect(first.incidentName).toBe(parsed.body.incident.name);
    expect(first.severity).toBe('High');
  });
});

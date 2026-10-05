// Plan 5.3: Live Sentinel webhook streaming — pure validation + receipt logic.
// Zero Next.js imports here so the logic stays unit-testable (tsconfig.test
// excludes src/app/**). The Route Handler in src/app/api/v1/sentinel/webhook
// is a thin wrapper over these functions.

import { z } from 'zod';

const SentinelPropertiesSchema = z
  .object({
    title: z.string().min(1).max(256),
    description: z.string().min(1).max(4096),
    severity: z.enum(['Informational', 'Low', 'Medium', 'High']),
    status: z.enum(['New', 'Active', 'Closed']),
    classification: z.string().max(64).optional(),
    tactics: z.array(z.string().max(64)).max(16),
    techniques: z.array(z.string().max(32)).max(16),
    extendedProperties: z
      .object({
        quorumSeverityScore: z.string().max(16),
        quorumSeverityEquation: z.string().max(2000),
        familiesPresent: z.string().max(256),
        contributingIpsCount: z.string().max(16),
        compromisedAccounts: z.string().max(2000),
      })
      .strict(),
  })
  .strict();

export const SentinelIncidentSchema = z
  .object({
    name: z.string().min(1).max(256),
    type: z.literal('Microsoft.SecurityInsights/Incidents'),
    properties: SentinelPropertiesSchema,
  })
  .strict();

export const SentinelWebhookBodySchema = z
  .object({
    incident: SentinelIncidentSchema,
    demoMode: z.boolean().optional(),
  })
  .strict();

export type SentinelWebhookBody = z.infer<typeof SentinelWebhookBodySchema>;

export interface WebhookReceipt {
  readonly receiptId: string;
  readonly incidentName: string;
  readonly severity: string;
  readonly familiesPresent: string;
  readonly receivedAt: string;
}

export interface WebhookParseResult {
  readonly ok: boolean;
  readonly body?: SentinelWebhookBody;
  readonly issues?: string;
}

/**
 * Strictly validates an incoming Sentinel webhook payload.
 * Returns a structured result — never throws on malformed input.
 */
export function parseWebhookPayload(input: unknown): WebhookParseResult {
  const parsed = SentinelWebhookBodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: JSON.stringify(parsed.error.issues) };
  }
  return { ok: true, body: parsed.data };
}

/**
 * Builds a deterministic demo receipt for a validated payload.
 * receiptId is derived from the incident name hash chain input so identical
 * incident replays produce traceable duplicate receipts (idempotent display).
 */
export function createWebhookReceipt(
  body: SentinelWebhookBody,
  receivedAt: string = new Date().toISOString()
): WebhookReceipt {
  const name = body.incident.name;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (Math.imul(hash, 31) + name.charCodeAt(i)) | 0;
  }
  const receiptId = `wh_${Math.abs(hash).toString(16).padStart(8, '0')}`;
  return {
    receiptId,
    incidentName: name,
    severity: body.incident.properties.severity,
    familiesPresent: body.incident.properties.extendedProperties.familiesPresent,
    receivedAt,
  };
}

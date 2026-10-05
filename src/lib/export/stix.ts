import { Incident } from '../../types/auth-event';
import { uuidV5 } from '../crypto/uuid-v5';

export interface StixBundle {
  type: 'bundle';
  id: string;
  objects: Array<Record<string, unknown>>;
}

export interface StixValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/** Quorum's private enterprise namespace (UUIDv5, generated once, never changes). */
const QUORUM_STIX_NAMESPACE = 'e6b2d597-9f1a-5d24-8f27-4b8a1c3d5e60';
const IDENTITY_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Fixed Quorum producer identity

/** STIX 2.1 requires RFC 3339 timestamps with millisecond precision. */
function toStixTimestamp(iso: string): string {
  const ms = new Date(iso).getTime();
  const stamp = new Date(Number.isNaN(ms) ? 0 : ms).toISOString(); // e.g. 2026-09-28T08:00:00.000Z
  return stamp;
}

/** STIX ids are `type--UUID`; SCO ids must be derived from the object's key properties. */
function deterministicStixId(type: string, key: string): string {
  return `${type}--${uuidV5(QUORUM_STIX_NAMESPACE, `${type}:${key}`)}`;
}

/** STIX patterns are single-quoted strings; embedded quotes must be escaped. */
function stixEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const MAX_PATTERN_VALUES = 100;

/**
 * Serializes a Quorum incident to an OASIS STIX 2.1 JSON bundle.
 * Deterministic: identical incidents produce byte-identical bundles.
 */
export function exportToStix21(incident: Incident): StixBundle {
  const created = toStixTimestamp(incident.createdAt);

  const identityObj: Record<string, unknown> = {
    type: 'identity',
    spec_version: '2.1',
    id: `identity--${IDENTITY_UUID}`,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    name: 'Quorum Detection Engine',
    description: 'Campaign-correlation detection layer for VPN authentication telemetry (Redmond Labs).',
    identity_class: 'system',
  };

  const ips = incident.contributingIps.slice(0, MAX_PATTERN_VALUES);
  const patternValues = ips.map((ip) => `'${stixEscape(ip)}'`).join(', ');
  const pattern = `[ipv4-addr:value IN (${patternValues})]`;

  const indicatorObj: Record<string, unknown> = {
    type: 'indicator',
    spec_version: '2.1',
    id: deterministicStixId('indicator', incident.id),
    created,
    modified: created,
    name: incident.title,
    description: `Quorum severity equation: ${incident.severityEquation}`,
    indicator_types: ['malicious-activity'],
    pattern_type: 'stix',
    pattern,
    valid_from: created,
    valid_until: undefined,
    labels: incident.familiesPresent.map((f) => f.toLowerCase()),
    custom_properties: {
      quorum_severity_score: incident.severityScore,
      quorum_severity_tier: incident.severityTier,
      quorum_compromised_accounts: incident.compromisedAccounts,
    },
  };
  // STIX 2.1 forbids empty valid_until; only emit it when meaningful.
  delete (indicatorObj as Record<string, unknown>).valid_until;

  const objects: Array<Record<string, unknown>> = [identityObj, indicatorObj];

  // IPv4 SCOs (bounded to 100 for bundle size governance)
  for (const ip of ips) {
    objects.push({
      type: 'ipv4-addr',
      spec_version: '2.1',
      id: deterministicStixId('ipv4-addr', ip),
      value: ip,
    });
  }

  // User-account SCOs (bounded to 100)
  for (const user of incident.compromisedAccounts.slice(0, MAX_PATTERN_VALUES)) {
    objects.push({
      type: 'user-account',
      spec_version: '2.1',
      id: deterministicStixId('user-account', user),
      user_id: user,
      account_type: 'internet',
      is_service_account: false,
    });
  }

  return {
    type: 'bundle',
    id: deterministicStixId('bundle', incident.id),
    objects,
  };
}

/**
 * Structural + semantic validation of a generated STIX bundle against the
 * STIX 2.1 spec rules that break downstream ingestion most often:
 * object id format, required common properties, SCO required fields,
 * and pattern_type/pattern pairing.
 */
export function validateStixBundle(bundle: StixBundle): StixValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (bundle.type !== 'bundle') {
    errors.push('Bundle type must be "bundle".');
  }
  if (!/^bundle--[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(bundle.id)) {
    errors.push(`Invalid bundle id: ${bundle.id}`);
  }
  if (!Array.isArray(bundle.objects) || bundle.objects.length === 0) {
    return { valid: false, errors: ['Bundle must contain at least one object.'] };
  }

  const SDO_TYPES = new Set(['identity', 'indicator', 'malware', 'threat-actor', 'intrusion-set']);
  const SCO_TYPES = new Set(['ipv4-addr', 'user-account', 'email-addr', 'file', 'url']);

  for (const obj of bundle.objects) {
    const type = obj.type as string;
    const id = obj.id as string;

    if (typeof id !== 'string' || !id.startsWith(`${type}--`)) {
      errors.push(`Object id "${id}" does not match required format ${type}--UUID.`);
      continue;
    }
    if (seenIds.has(id)) {
      errors.push(`Duplicate object id: ${id}`);
    }
    seenIds.add(id);

    if (SDO_TYPES.has(type)) {
      for (const required of ['spec_version', 'created', 'modified']) {
        if (!obj[required]) {
          errors.push(`${type} object ${id} is missing required common property "${required}".`);
        }
      }
    }

    if (type === 'ipv4-addr' && typeof obj.value !== 'string') {
      errors.push(`ipv4-addr SCO ${id} is missing required "value".`);
    }
    if (type === 'indicator') {
      if (obj.pattern_type !== 'stix' && obj.pattern_type !== 'sigma' && obj.pattern_type !== 'pcre') {
        errors.push(`Indicator ${id} has invalid pattern_type.`);
      }
      if (typeof obj.pattern !== 'string' || !obj.pattern.startsWith('[')) {
        errors.push(`Indicator ${id} is missing a valid STIX pattern.`);
      }
      if (obj.valid_until !== undefined && obj.valid_until !== null) {
        const vf = new Date(String(obj.valid_from)).getTime();
        const vu = new Date(String(obj.valid_until)).getTime();
        if (!Number.isNaN(vf) && !Number.isNaN(vu) && vu <= vf) {
          errors.push(`Indicator ${id}: valid_until must be later than valid_from.`);
        }
      }
    }
    if (SCO_TYPES.has(type) && obj.spec_version !== undefined) {
      // Per spec, SCOs do not carry created/modified; spec_version is allowed but optional.
      if (obj.created !== undefined || obj.modified !== undefined) {
        errors.push(`SCO ${id} must not carry created/modified properties.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

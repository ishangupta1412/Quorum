import { Incident } from '../../types/auth-event';

export interface SentinelIncidentPayload {
  name: string;
  type: string;
  properties: {
    title: string;
    description: string;
    severity: 'Informational' | 'Low' | 'Medium' | 'High';
    status: 'New' | 'Active' | 'Closed';
    classification?: 'TruePositive' | 'FalsePositive' | 'BenignPositive' | 'Undetermined';
    tactics: string[];
    techniques: string[];
    extendedProperties: {
      quorumSeverityScore: string;
      quorumSeverityEquation: string;
      familiesPresent: string;
      contributingIpsCount: string;
      compromisedAccounts: string;
    };
  };
}

export interface SentinelValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/** Governance caps: Sentinel incident fields have practical API size limits. */
const MAX_TITLE_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 4096;
const MAX_EXTENDED_VALUE_LENGTH = 1024;

function clampString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

/** Strips control characters that break the Azure Resource Manager JSON path. */
function sanitize(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/**
 * Serializes a Quorum incident to Microsoft Sentinel incident JSON
 * (Azure Resource Manager `Microsoft.SecurityInsights/Incidents` shape).
 * Deterministic; no timestamps emitted (Sentinel sets them server-side).
 */
export function exportToSentinel(incident: Incident): SentinelIncidentPayload {
  // Sentinel severity is capped at High; CRITICAL maps onto High + quarried metadata.
  let sentinelSeverity: SentinelIncidentPayload['properties']['severity'] = 'Medium';
  if (incident.severityTier === 'CRITICAL' || incident.severityTier === 'HIGH') {
    sentinelSeverity = 'High';
  } else if (incident.severityTier === 'LOW') {
    sentinelSeverity = 'Low';
  }

  const compromised = incident.compromisedAccounts.map(sanitize).slice(0, 50);
  const title = clampString(sanitize(`[Quorum] ${incident.title}`), MAX_TITLE_LENGTH);
  const description = clampString(
    sanitize(
      `Correlated multi-source VPN campaign detected by Quorum. ` +
        `Severity Equation: ${incident.severityEquation}. ` +
        `Families: ${incident.familiesPresent.join(', ')}. ` +
        `Targets: ${incident.targetedAccounts.length} accounts. ` +
        `Compromised: ${compromised.length > 0 ? compromised.join(', ') : 'None'}.`
    ),
    MAX_DESCRIPTION_LENGTH
  );

  return {
    name: incident.id,
    type: 'Microsoft.SecurityInsights/Incidents',
    properties: {
      title,
      description,
      severity: sentinelSeverity,
      status: 'New',
      // Confirmed compromise -> TruePositive; otherwise leave classification to the analyst.
      classification: compromised.length > 0 ? 'TruePositive' : 'Undetermined',
      tactics: ['CredentialAccess', 'InitialAccess'],
      techniques: ['T1110.003', 'T1078'],
      extendedProperties: {
        quorumSeverityScore: String(incident.severityScore),
        quorumSeverityEquation: clampString(sanitize(incident.severityEquation), MAX_EXTENDED_VALUE_LENGTH),
        familiesPresent: incident.familiesPresent.join(','),
        contributingIpsCount: String(incident.contributingIps.length),
        compromisedAccounts: clampString(compromised.join(',') || 'None', MAX_EXTENDED_VALUE_LENGTH),
      },
    },
  };
}

/**
 * Pre-flight validation before handing the payload to the Sentinel ARM API.
 * Catches oversized fields and malformed enum values that would otherwise
 * surface as opaque 400s from the ingestion endpoint.
 */
export function validateSentinelPayload(payload: SentinelIncidentPayload): SentinelValidationResult {
  const errors: string[] = [];

  if (!payload.name || typeof payload.name !== 'string') {
    errors.push('Incident "name" (resource identifier) is required.');
  }
  if (payload.type !== 'Microsoft.SecurityInsights/Incidents') {
    errors.push(`Unexpected resource type: ${payload.type}`);
  }

  const p = payload.properties;
  if (!p) {
    return { valid: false, errors: ['Missing "properties" object.'] };
  }
  if (p.title.length === 0 || p.title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be 1-${MAX_TITLE_LENGTH} characters (got ${p.title.length}).`);
  }
  if (p.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description exceeds ${MAX_DESCRIPTION_LENGTH} characters (got ${p.description.length}).`);
  }
  if (!['Informational', 'Low', 'Medium', 'High'].includes(p.severity)) {
    errors.push(`Invalid Sentinel severity: ${String(p.severity)}`);
  }
  if (!['New', 'Active', 'Closed'].includes(p.status)) {
    errors.push(`Invalid Sentinel status: ${String(p.status)}`);
  }
  if (!Array.isArray(p.tactics) || p.tactics.length === 0) {
    errors.push('At least one MITRE tactic is required.');
  }
  if (!Array.isArray(p.techniques) || p.techniques.length === 0) {
    errors.push('At least one MITRE technique is required.');
  }
  for (const t of p.techniques ?? []) {
    if (!/^T\d{4}(?:\.\d{3})?$/.test(t)) {
      errors.push(`Malformed MITRE technique id: ${t}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

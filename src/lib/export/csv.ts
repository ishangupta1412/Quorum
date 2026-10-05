// F25C: Deterministic CSV exporter for correlated Quorum incidents.
// Pure TypeScript, zero external dependencies. RFC 4180 field escaping.

import { Incident } from '../../types/auth-event';

export const CSV_HEADER =
  'incident_id,title,severity_score,severity_tier,severity_equation,families_present,signal_count,contributing_ip_count,contributing_ips,targeted_account_count,targeted_accounts,compromised_accounts,status,created_at';

/**
 * Escapes a single CSV field per RFC 4180: fields containing a comma, quote,
 * or newline are wrapped in quotes with interior quotes doubled.
 */
export function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function incidentToRow(incident: Incident): string {
  const fields = [
    incident.id,
    incident.title,
    String(incident.severityScore),
    incident.severityTier,
    incident.severityEquation,
    incident.familiesPresent.join(';'),
    String(incident.signalIds.length),
    String(incident.contributingIps.length),
    incident.contributingIps.join(';'),
    String(incident.targetedAccounts.length),
    incident.targetedAccounts.join(';'),
    incident.compromisedAccounts.join(';'),
    incident.status,
    incident.createdAt,
  ];
  return fields.map(escapeCsvField).join(',');
}

/**
 * Serializes one incident to CSV (header + single data row).
 */
export function exportIncidentToCsv(incident: Incident): string {
  return `${CSV_HEADER}\n${incidentToRow(incident)}\n`;
}

/**
 * Serializes a batch of incidents to CSV (header + one row per incident).
 * Deterministic: row order follows input order, field order is fixed.
 */
export function exportIncidentsToCsv(incidents: readonly Incident[]): string {
  const rows = incidents.map(incidentToRow);
  return `${CSV_HEADER}\n${rows.join('\n')}${rows.length > 0 ? '\n' : ''}`;
}

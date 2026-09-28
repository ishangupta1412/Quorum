import { Incident } from '../../types/auth-event';

export interface SentinelIncidentPayload {
  name: string;
  type: string;
  properties: {
    title: string;
    description: string;
    severity: 'Informational' | 'Low' | 'Medium' | 'High';
    status: 'New' | 'Active' | 'Closed';
    classification?: string;
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

/**
 * Serializes a Quorum incident to Microsoft Sentinel JSON format.
 */
export function exportToSentinel(incident: Incident): SentinelIncidentPayload {
  let sentinelSeverity: 'Informational' | 'Low' | 'Medium' | 'High' = 'Medium';
  if (incident.severityTier === 'CRITICAL' || incident.severityTier === 'HIGH') {
    sentinelSeverity = 'High';
  } else if (incident.severityTier === 'LOW') {
    sentinelSeverity = 'Low';
  }

  return {
    name: incident.id,
    type: 'Microsoft.SecurityInsights/Incidents',
    properties: {
      title: `[Quorum] ${incident.title}`,
      description: `Correlated multi-source VPN campaign detected by Quorum. Severity Equation: ${incident.severityEquation}`,
      severity: sentinelSeverity,
      status: 'New',
      classification: incident.compromisedAccounts.length > 0 ? 'TruePositive' : 'Undetermined',
      tactics: ['CredentialAccess', 'InitialAccess', 'LateralMovement'],
      techniques: ['T1110.003', 'T1078'],
      extendedProperties: {
        quorumSeverityScore: String(incident.severityScore),
        quorumSeverityEquation: incident.severityEquation,
        familiesPresent: incident.familiesPresent.join(','),
        contributingIpsCount: String(incident.contributingIps.length),
        compromisedAccounts: incident.compromisedAccounts.join(',') || 'None',
      },
    },
  };
}

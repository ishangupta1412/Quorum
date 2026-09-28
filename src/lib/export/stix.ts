import { Incident } from '../../types/auth-event';

export interface StixBundle {
  type: 'bundle';
  id: string;
  objects: Array<Record<string, unknown>>;
}

/**
 * Serializes a Quorum incident to a STIX 2.1 JSON bundle.
 */
export function exportToStix21(incident: Incident): StixBundle {
  const bundleId = `bundle--${incident.id}`;
  const identityId = 'identity--c8b827e8-0b2a-4c28-98e3-0599a0d84310';
  const indicatorId = `indicator--${incident.id}`;

  const identityObj = {
    type: 'identity',
    spec_version: '2.1',
    id: identityId,
    name: 'Quorum Detection Engine',
    identity_class: 'system',
  };

  const indicatorObj = {
    type: 'indicator',
    spec_version: '2.1',
    id: indicatorId,
    created: incident.createdAt,
    modified: incident.createdAt,
    name: incident.title,
    description: `Quorum severity equation: ${incident.severityEquation}`,
    indicator_types: ['malicious-activity'],
    pattern_type: 'stix',
    pattern: `[ipv4-addr:value IN (${incident.contributingIps.map((ip) => `'${ip}'`).join(', ')})]`,
    valid_from: incident.createdAt,
  };

  const objects: Array<Record<string, unknown>> = [identityObj, indicatorObj];

  // Add individual IPv4 SCOs
  for (const ip of incident.contributingIps.slice(0, 50)) {
    objects.push({
      type: 'ipv4-addr',
      spec_version: '2.1',
      id: `ipv4-addr--${ip}`,
      value: ip,
    });
  }

  // Add user account SCOs
  for (const user of incident.compromisedAccounts) {
    objects.push({
      type: 'user-account',
      spec_version: '2.1',
      id: `user-account--${user}`,
      user_id: user,
      account_type: 'vpn',
    });
  }

  return {
    type: 'bundle',
    id: bundleId,
    objects,
  };
}

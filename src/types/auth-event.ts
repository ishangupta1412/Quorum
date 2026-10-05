// Canonical Type Definitions for Quorum
// Strictly follows Quorum_PRD_v4.md Section 7 and 9

export type AuthOutcome =
  | 'SUCCESS'
  | 'FAILURE_BAD_CREDENTIALS'
  | 'FAILURE_LOCKED'
  | 'FAILURE_MFA'
  | 'FAILURE_EXPIRED'
  | 'UNKNOWN';

export type IpScope = 'public' | 'private';

export interface AuthEvent {
  readonly eventHash: string;          // SHA-256 of canonical fields
  readonly timestamp: string;          // ISO 8601 UTC
  readonly tsTzAssumed: boolean;       // true if original lacked explicit TZ
  readonly tsAnomaly?: 'future' | 'ancient';
  readonly userName: string;           // canonical lowercased, domain/@upn stripped
  readonly userRaw: string;            // raw string preserved for audit
  readonly userPresent: boolean;       // false if pre-auth error / missing
  readonly srcIp: string;              // canonical IPv4/IPv6, ::ffff: unwrapped
  readonly ipScope: IpScope;           // RFC1918 check
  readonly eventOutcome: AuthOutcome;  // 6-value strict enum
  readonly sourceSystem: string;       // e.g. CiscoAnyConnect, Fortinet, AzureVPN
}

export type DetectorFamily = 'VOLUME' | 'STATISTICAL' | 'GRAPH' | 'PIVOT' | 'ML';

export interface Signal {
  readonly id: string;
  readonly detectorId: string;         // e.g. 'F5_brute', 'F6_spray', 'F7_campaign', 'F10_pivot', 'antigravity-01'
  readonly detectorFamily: DetectorFamily;
  readonly confidenceScore: number;    // 0-100
  readonly entityKey: string;          // e.g. 'ip:198.51.100.22' or 'user:marcus'
  readonly eventHashes: readonly string[];
  readonly evidenceBundle: Record<string, unknown>;
  readonly timestamp: string;
  // Optional Section 4.4 PRD protocol compatibility fields
  readonly entityType?: string;
  readonly entityValue?: string;
  readonly windowStart?: string;
  readonly windowEnd?: string;
  readonly rawScore?: number;
  readonly normalisedScore?: number;
  readonly evidenceEventHashes?: readonly string[];
  readonly mitreTechnique?: string;
  readonly paramsSnapshot?: Record<string, unknown>;
}

export type SeverityTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Incident {
  readonly id: string;
  readonly title: string;
  readonly severityScore: number;      // 0-100
  readonly severityTier: SeverityTier;
  readonly severityEquation: string;   // Printed arithmetic representation
  readonly familiesPresent: readonly DetectorFamily[];
  readonly signalIds: readonly string[];
  readonly contributingIps: readonly string[];
  readonly targetedAccounts: readonly string[];
  readonly compromisedAccounts: readonly string[];
  readonly status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'FALSE_POSITIVE';
  readonly createdAt: string;
}

export interface AuditEntry {
  readonly sequenceId: number;
  readonly timestamp: string;
  readonly actorId: string;
  readonly actionType: string;
  readonly targetEntityType: string;
  readonly targetEntityId: string;
  readonly payloadHash: string;
  readonly prevRecordHash: string;
  readonly recordHash: string;
}

export interface IngestRejection {
  readonly rawLine: string;
  readonly reasonCode: 'EMPTY_LINE' | 'UNPARSEABLE' | 'IMPLAUSIBLE_TS' | 'MISSING_SOURCE';
  readonly lineNumber: number;
}

import { normalizeAuthEvent, NormalizationResult } from './normalizer';
import { IngestRejection, AuthEvent } from '../types/auth-event';
import {
  truncateRejectionRawLine,
  sanitizeTelemetryRow,
  readTelemetryField,
} from '../lib/security/redteam';

export interface BatchIngestResult {
  readonly accepted: readonly AuthEvent[];
  readonly rejected: readonly IngestRejection[];
}

/** Coerces a telemetry field to the string shape the F2 normalizer expects. */
function fieldAsString(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return String(value);
}

/**
 * Parses a JSON Lines payload into canonical AuthEvents.
 */
export function parseJsonLines(
  content: string,
  defaultSource: string = 'CiscoAnyConnect'
): BatchIngestResult {
  const lines = content.split(/\r?\n/);
  const accepted: AuthEvent[] = [];
  const rejected: IngestRejection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    try {
      // Credential-shaped keys are stripped BEFORE normalization so raw
      // secrets can never reach an AuthEvent, evidence bundle, or log line.
      const parsed = sanitizeTelemetryRow(JSON.parse(rawLine));
      const res: NormalizationResult = normalizeAuthEvent({
        rawTimestamp: readTelemetryField(parsed, ['timestamp', 'time', 'ts']),
        rawUser: fieldAsString(readTelemetryField(parsed, ['user', 'username', 'user_name'])),
        rawIp: fieldAsString(readTelemetryField(parsed, ['ip', 'src_ip', 'client_ip'])),
        rawOutcome: fieldAsString(readTelemetryField(parsed, ['outcome', 'action', 'status'])),
        sourceSystem:
          (readTelemetryField(parsed, ['source_system', 'source']) as string | undefined) ||
          defaultSource,
      });

      if (res.event) {
        accepted.push(res.event);
      } else if (res.rejected) {
        rejected.push({
          rawLine: truncateRejectionRawLine(rawLine),
          reasonCode: res.rejected.reasonCode,
          lineNumber: i + 1,
        });
      }
    } catch {
      // rawLine is attacker-controlled: store a bounded sample, never the full line.
      rejected.push({
        rawLine: truncateRejectionRawLine(rawLine),
        reasonCode: 'UNPARSEABLE',
        lineNumber: i + 1,
      });
    }
  }

  return { accepted, rejected };
}

/**
 * Parses CSV format telemetry into canonical AuthEvents.
 * Expects headers: timestamp,user,ip,outcome,[source]
 */
export function parseCsvTelemetry(
  csvContent: string,
  defaultSource: string = 'CiscoAnyConnect'
): BatchIngestResult {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { accepted: [], rejected: [] };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const tsIdx = headers.findIndex((h) => h.includes('time') || h === 'ts');
  const userIdx = headers.findIndex((h) => h.includes('user'));
  const ipIdx = headers.findIndex((h) => h.includes('ip'));
  const outcomeIdx = headers.findIndex((h) => h.includes('outcome') || h.includes('status') || h.includes('action'));
  const srcIdx = headers.findIndex((h) => h.includes('source'));

  const accepted: AuthEvent[] = [];
  const rejected: IngestRejection[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 3) {
      rejected.push({ rawLine: truncateRejectionRawLine(line), reasonCode: 'UNPARSEABLE', lineNumber: i + 1 });
      continue;
    }

    const res = normalizeAuthEvent({
      rawTimestamp: tsIdx !== -1 ? cols[tsIdx] : undefined,
      rawUser: userIdx !== -1 ? cols[userIdx] : undefined,
      rawIp: ipIdx !== -1 ? cols[ipIdx] : undefined,
      rawOutcome: outcomeIdx !== -1 ? cols[outcomeIdx] : undefined,
      sourceSystem: srcIdx !== -1 ? cols[srcIdx] : defaultSource,
    });

    if (res.event) {
      accepted.push(res.event);
    } else if (res.rejected) {
      rejected.push({ rawLine: truncateRejectionRawLine(line), reasonCode: res.rejected.reasonCode, lineNumber: i + 1 });
    }
  }

  return { accepted, rejected };
}

import { normalizeAuthEvent, NormalizationResult } from './normalizer';
import { IngestRejection, AuthEvent } from '../types/auth-event';

export interface BatchIngestResult {
  readonly accepted: readonly AuthEvent[];
  readonly rejected: readonly IngestRejection[];
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
      const parsed = JSON.parse(rawLine);
      const res: NormalizationResult = normalizeAuthEvent({
        rawTimestamp: parsed.timestamp || parsed.time || parsed.ts,
        rawUser: parsed.user || parsed.username || parsed.user_name,
        rawIp: parsed.ip || parsed.src_ip || parsed.client_ip,
        rawOutcome: parsed.outcome || parsed.action || parsed.status,
        sourceSystem: parsed.source_system || parsed.source || defaultSource,
      });

      if (res.event) {
        accepted.push(res.event);
      } else if (res.rejected) {
        rejected.push({
          rawLine,
          reasonCode: res.rejected.reasonCode,
          lineNumber: i + 1,
        });
      }
    } catch {
      rejected.push({
        rawLine,
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
      rejected.push({ rawLine: line, reasonCode: 'UNPARSEABLE', lineNumber: i + 1 });
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
      rejected.push({ rawLine: line, reasonCode: res.rejected.reasonCode, lineNumber: i + 1 });
    }
  }

  return { accepted, rejected };
}

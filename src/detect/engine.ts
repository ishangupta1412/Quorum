import { AuthEvent, Signal, Incident } from '../types/auth-event';
import { detectBruteForce } from './brute-force';
import { detectSingleSpray } from './spray-single';
import { detectCampaignGraph } from './campaign-graph';
import { detectPivot } from './pivot';
import { buildIncidentsFromSignals } from './consensus';

export interface DetectionResult {
  readonly signals: readonly Signal[];
  readonly incidents: readonly Incident[];
  readonly stats: {
    readonly totalEventsProcessed: number;
    readonly signalsGenerated: number;
    readonly incidentsGenerated: number;
    readonly executionTimeMs: number;
  };
}

/**
 * Executes the complete Quorum detection plane across a batch of canonical AuthEvents.
 * Pure functional execution: zero network calls, zero external side effects.
 */
export function runDetectionPipeline(events: readonly AuthEvent[]): DetectionResult {
  const startTime = Date.now();

  // Phase 1: Run volume and statistical detectors
  const f5Signals = detectBruteForce(events);
  const f6Signals = detectSingleSpray(events);

  // Phase 2: Run graph campaign detector (Union-Find)
  const f7Signals = detectCampaignGraph(events);

  const initialSignals: Signal[] = [...f5Signals, ...f6Signals, ...f7Signals];

  // Phase 3: Run post-spray pivot detector (climax)
  const f10Signals = detectPivot(events, initialSignals);

  const allSignals: Signal[] = [...initialSignals, ...f10Signals];

  // Phase 4: Compute multi-family consensus severity and construct incidents
  const incidents = buildIncidentsFromSignals(allSignals);

  const executionTimeMs = Date.now() - startTime;

  return {
    signals: allSignals,
    incidents,
    stats: {
      totalEventsProcessed: events.length,
      signalsGenerated: allSignals.length,
      incidentsGenerated: incidents.length,
      executionTimeMs,
    },
  };
}

import { AuthEvent, Signal } from '../types/auth-event';

export interface PivotConfig {
  maxPivotWindowHours: number; // default 48 hours after campaign activity
}

/**
 * F10: Post-Spray Pivot Detector
 * Climax algorithm: Turns "suspicious spray pattern" into "confirmed compromise"
 * when a sprayed account subsequently has an authenticating SUCCESS event.
 */
export function detectPivot(
  events: readonly AuthEvent[],
  priorSignals: readonly Signal[],
  config: PivotConfig = { maxPivotWindowHours: 48 }
): readonly Signal[] {
  const pivotSignals: Signal[] = [];

  // Extract all accounts targeted by spray or campaign graph signals
  const targetedAccountMap = new Map<string, { signalId: string; firstSeen: string }>();

  for (const signal of priorSignals) {
    if (signal.detectorFamily === 'GRAPH' || signal.detectorFamily === 'STATISTICAL') {
      const accounts = (signal.evidenceBundle.targetedAccounts as string[]) || [];
      for (const account of accounts) {
        if (!targetedAccountMap.has(account)) {
          targetedAccountMap.set(account, {
            signalId: signal.id,
            firstSeen: signal.timestamp,
          });
        }
      }
    }
  }

  if (targetedAccountMap.size === 0) return [];

  // Find SUCCESS events for any of the targeted accounts
  const successEvents = events.filter(
    (e) =>
      e.eventOutcome === 'SUCCESS' &&
      e.userPresent &&
      targetedAccountMap.has(e.userName)
  );

  for (const successEvent of successEvents) {
    const sprayInfo = targetedAccountMap.get(successEvent.userName)!;
    const sprayTimeMs = new Date(sprayInfo.firstSeen).getTime();
    const successTimeMs = new Date(successEvent.timestamp).getTime();

    // Check if the success happened after the spray began, within window
    const maxWindowMs = config.maxPivotWindowHours * 3600 * 1000;
    if (successTimeMs >= sprayTimeMs - 3600 * 1000 && successTimeMs <= sprayTimeMs + maxWindowMs) {
      pivotSignals.push({
        id: `sig_f10_pivot_${successEvent.userName}_${successTimeMs}`,
        detectorId: 'F10_pivot',
        detectorFamily: 'PIVOT',
        confidenceScore: 100, // Maximum confidence — confirmed compromise
        entityKey: `user:${successEvent.userName}`,
        eventHashes: [successEvent.eventHash],
        evidenceBundle: {
          compromisedUser: successEvent.userName,
          pivotIp: successEvent.srcIp,
          pivotTimestamp: successEvent.timestamp,
          priorSpraySignalId: sprayInfo.signalId,
          sourceSystem: successEvent.sourceSystem,
        },
        timestamp: successEvent.timestamp,
      });
    }
  }

  return pivotSignals;
}

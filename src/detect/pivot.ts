import { AuthEvent, Signal } from '../types/auth-event';

export interface PivotConfig {
  maxPivotWindowHours: number; // default 48 hours after campaign activity
}

/**
 * F10: Post-Spray Pivot Detector
 * Climax algorithm: Turns "suspicious spray pattern" into "confirmed compromise"
 * when a sprayed account subsequently has an authenticating SUCCESS event.
 *
 * Red-team hardening (2026-09-29). Two false-positive paths were closed:
 *
 * 1. Legacy behavior anchored the pivot window to the spray *signal's*
 *    timestamp (typically the LAST spray event) and accepted SUCCESS events
 *    up to 1h BEFORE that anchor. An account that logged in successfully an
 *    hour before anyone ever sprayed it was flagged as "compromised" — an
 *    analyst-visible false positive an adversary can trigger at will by
 *    spraying the entire directory right after any routine login.
 *    Fix: anchor = FIRST failure for that account, and the SUCCESS must occur
 *    at or after it.
 *
 * 2. Legacy behavior ignored WHERE the success came from. A sprayed account's
 *    normal morning login from its usual corporate IP was indistinguishable
 *    from a proxy-IP takeover. Fix: if the cluster evidence contains IPs,
 *    the pivot's srcIp must belong to the campaign's IP set (defeats the
 *    "spray the whole tenant, harvest the noise" gaming strategy).
 */
export function detectPivot(
  events: readonly AuthEvent[],
  priorSignals: readonly Signal[],
  config: PivotConfig = { maxPivotWindowHours: 48 }
): readonly Signal[] {
  const pivotSignals: Signal[] = [];

  // Extract all accounts targeted by spray or campaign graph signals,
  // with the FIRST failure time for that account as the pivot anchor.
  const targetedAccountMap = new Map<
    string,
    { signalId: string; firstFailureMs: number; campaignIps: ReadonlySet<string> | null }
  >();

  for (const signal of priorSignals) {
    if (signal.detectorFamily === 'GRAPH' || signal.detectorFamily === 'STATISTICAL') {
      const accounts = (signal.evidenceBundle.targetedAccounts as string[]) || [];
      const bundleIps = (signal.evidenceBundle.contributingIps as string[]) || [];
      const campaignIps = bundleIps.length > 0 ? new Set(bundleIps) : null;

      for (const account of accounts) {
        const existing = targetedAccountMap.get(account);
        const signalMs = new Date(signal.timestamp).getTime();

        if (!existing) {
          targetedAccountMap.set(account, {
            signalId: signal.id,
            firstFailureMs: signalMs,
            campaignIps,
          });
        } else {
          // Keep the earliest anchor across signals; merge IP sets so a pivot
          // through any participating cluster leg is recognized.
          if (signalMs < existing.firstFailureMs) {
            existing.firstFailureMs = signalMs;
          }
          if (campaignIps) {
            const merged = new Set(existing.campaignIps ?? []);
            for (const ip of campaignIps) merged.add(ip);
            existing.campaignIps = merged;
          }
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

  const maxWindowMs = config.maxPivotWindowHours * 3600 * 1000;

  for (const successEvent of successEvents) {
    const sprayInfo = targetedAccountMap.get(successEvent.userName)!;
    const successTimeMs = new Date(successEvent.timestamp).getTime();

    // The pivot must occur AFTER the first observed spray failure against this
    // account (a pre-attack login is not a compromise) and within the window.
    const afterFirstFailure = successTimeMs >= sprayInfo.firstFailureMs;
    const withinWindow = successTimeMs <= sprayInfo.firstFailureMs + maxWindowMs;

    // Source-attribution check: the pivot login must arrive from an IP that
    // participated in the campaign when the evidence provides IP topology.
    const ipKnownToCampaign =
      sprayInfo.campaignIps === null || sprayInfo.campaignIps.has(successEvent.srcIp);

    if (afterFirstFailure && withinWindow && ipKnownToCampaign) {
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
          anchoredToFirstFailureMs: sprayInfo.firstFailureMs,
        },
        timestamp: successEvent.timestamp,
      });
    }
  }

  return pivotSignals;
}

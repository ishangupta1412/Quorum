import { AuthEvent, Signal } from '../types/auth-event';

export interface SingleSprayConfig {
  windowHours: number; // default 24 hours
  minTargetedAccounts: number; // default 12 accounts
  maxFailuresPerAccount: number; // default 3 (spray signature: low per-account count)
}

/**
 * F6: Single-Source Password Spray Detector
 * Catches an attacker attempting a few passwords across many accounts from one IP.
 */
export function detectSingleSpray(
  events: readonly AuthEvent[],
  config: SingleSprayConfig = {
    windowHours: 24,
    minTargetedAccounts: 12,
    maxFailuresPerAccount: 3,
  }
): readonly Signal[] {
  const windowMs = config.windowHours * 3600 * 1000;
  const signals: Signal[] = [];

  // Group failures by IP
  const ipGroups = new Map<string, AuthEvent[]>();

  for (const event of events) {
    if (event.eventOutcome === 'SUCCESS') continue;
    if (!event.userPresent || event.userName === '__unknown__') continue;

    const group = ipGroups.get(event.srcIp) || [];
    group.push(event);
    ipGroups.set(event.srcIp, group);
  }

  for (const [srcIp, group] of ipGroups.entries()) {
    const sorted = [...group].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      const windowStartMs = new Date(sorted[i].timestamp).getTime();
      const inWindow = sorted.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= windowStartMs && t <= windowStartMs + windowMs;
      });

      // Count distinct targeted accounts
      const userFailureCounts = new Map<string, number>();
      for (const e of inWindow) {
        userFailureCounts.set(e.userName, (userFailureCounts.get(e.userName) || 0) + 1);
      }

      const distinctUsers = Array.from(userFailureCounts.keys());
      if (distinctUsers.length >= config.minTargetedAccounts) {
        const totalAttempts = inWindow.length;
        const avgAttemptsPerUser = totalAttempts / distinctUsers.length;

        if (avgAttemptsPerUser <= config.maxFailuresPerAccount) {
          signals.push({
            id: `sig_f6_${srcIp}_${windowStartMs}`,
            detectorId: 'F6_spray',
            detectorFamily: 'STATISTICAL',
            confidenceScore: Math.min(95, 60 + distinctUsers.length * 2),
            entityKey: `ip:${srcIp}`,
            eventHashes: inWindow.map((e) => e.eventHash),
            evidenceBundle: {
              srcIp,
              targetedAccountsCount: distinctUsers.length,
              targetedAccounts: distinctUsers.slice(0, 50),
              avgAttemptsPerUser: Math.round(avgAttemptsPerUser * 100) / 100,
              totalFailures: totalAttempts,
              windowHours: config.windowHours,
            },
            timestamp: inWindow[inWindow.length - 1].timestamp,
          });

          i += inWindow.length - 1;
        }
      }
    }
  }

  return signals;
}

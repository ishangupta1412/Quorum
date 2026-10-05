import { AuthEvent, Signal } from '../types/auth-event';

export interface SingleSprayConfig {
  windowHours: number; // default 24 hours
  minTargetedAccounts: number; // default 12 accounts
  maxFailuresPerAccount: number; // default 3 (spray signature: low per-account count)
}

/**
 * F6: Single-Source Password Spray Detector
 * Catches an attacker attempting a few passwords across many accounts from one IP.
 *
 * Red-team hardening (2026-09-29): sliding window converted from an O(n^2)
 * filter-per-event scan to two forward-only pointers with incrementally
 * maintained per-user failure counts (amortized O(n) after the sort).
 * Windows, counts, ids, and skip semantics are identical to the naive
 * detector; evidence account lists are sorted for stable serialization.
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
    const times = sorted.map((e) => new Date(e.timestamp).getTime());

    // Incrementally maintained window state for [i..j]
    const userCounts = new Map<string, number>();
    let distinctUsers = 0;
    let total = 0;

    const addAt = (idx: number) => {
      const u = sorted[idx].userName;
      const c = userCounts.get(u) || 0;
      userCounts.set(u, c + 1);
      if (c === 0) distinctUsers++;
      total++;
    };
    const removeAt = (idx: number) => {
      const u = sorted[idx].userName;
      const c = userCounts.get(u) || 0;
      if (c <= 1) {
        userCounts.delete(u);
        if (c === 1) distinctUsers--;
      } else {
        userCounts.set(u, c - 1);
      }
      total--;
    };

    let i = 0;
    let j = -1;
    while (i < sorted.length) {
      if (j < i - 1) j = i - 1;
      // Extend j to the last event still inside [times[i], times[i] + windowMs]
      while (j + 1 < sorted.length && times[j + 1] - times[i] <= windowMs) {
        j++;
        addAt(j);
      }

      const inWindowCount = j >= i ? j - i + 1 : 0;
      const avgAttemptsPerUser = distinctUsers > 0 ? total / distinctUsers : Infinity;

      if (
        inWindowCount > 0 &&
        distinctUsers >= config.minTargetedAccounts &&
        avgAttemptsPerUser <= config.maxFailuresPerAccount
      ) {
        const windowEvents = sorted.slice(i, j + 1);
        signals.push({
          id: `sig_f6_${srcIp}_${times[i]}`,
          detectorId: 'F6_spray',
          detectorFamily: 'STATISTICAL',
          confidenceScore: Math.min(95, 60 + distinctUsers * 2),
          entityKey: `ip:${srcIp}`,
          eventHashes: windowEvents.map((e) => e.eventHash),
          evidenceBundle: {
            srcIp,
            targetedAccountsCount: distinctUsers,
            targetedAccounts: Array.from(userCounts.keys()).sort().slice(0, 50),
            avgAttemptsPerUser: Math.round(avgAttemptsPerUser * 100) / 100,
            totalFailures: inWindowCount,
            windowHours: config.windowHours,
          },
          timestamp: sorted[j].timestamp,
        });

        // Consume the entire window (naive: i += inWindow.length - 1; i++)
        while (i <= j) {
          removeAt(i);
          i++;
        }
      } else {
        removeAt(i);
        i++;
      }
    }
  }

  return signals;
}

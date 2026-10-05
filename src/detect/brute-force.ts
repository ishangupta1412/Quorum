import { AuthEvent, Signal } from '../types/auth-event';

export interface BruteForceConfig {
  windowMinutes: number; // default 15
  failureThreshold: number; // default 5
}

/**
 * F5: Sliding-Window Brute Force Detector
 * Catches traditional loud single-IP -> single-account brute-force attacks.
 *
 * Red-team hardening (2026-09-29): the naive implementation recomputed the
 * in-window set with an O(n) filter per event, giving O(n^2) per group. A
 * hostile 100k-event burst against one (user, IP) pair pinned a CPU core
 * (found in red-team pass 1). This scan keeps two forward-only pointers
 * (i = window anchor, j = last in-window event), so the total work is
 * amortized O(n) after the sort — with output byte-identical to the naive
 * detector (same windows, same counts, same ids, same skip semantics).
 */
export function detectBruteForce(
  events: readonly AuthEvent[],
  config: BruteForceConfig = { windowMinutes: 15, failureThreshold: 5 }
): readonly Signal[] {
  const windowMs = config.windowMinutes * 60 * 1000;
  const signals: Signal[] = [];

  // Group failures by (user, IP)
  const failureGroups = new Map<string, AuthEvent[]>();

  for (const event of events) {
    if (event.eventOutcome === 'SUCCESS') continue;
    if (!event.userPresent || event.userName === '__unknown__') continue;

    const key = `${event.userName}|${event.srcIp}`;
    const group = failureGroups.get(key) || [];
    group.push(event);
    failureGroups.set(key, group);
  }

  for (const [key, group] of failureGroups.entries()) {
    const [userName, srcIp] = key.split('|');
    const sorted = [...group].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const times = sorted.map((e) => new Date(e.timestamp).getTime());

    let i = 0;
    let j = 0;
    while (i < sorted.length) {
      if (j < i) j = i;
      // Extend j to the last event still inside [times[i], times[i] + windowMs]
      while (j + 1 < sorted.length && times[j + 1] - times[i] <= windowMs) {
        j++;
      }
      const inWindowCount = j - i + 1;

      if (inWindowCount >= config.failureThreshold) {
        const windowEvents = sorted.slice(i, j + 1);
        signals.push({
          id: `sig_f5_${userName}_${srcIp}_${times[i]}`,
          detectorId: 'F5_brute',
          detectorFamily: 'VOLUME',
          confidenceScore: Math.min(100, 50 + inWindowCount * 5),
          entityKey: `user:${userName}`,
          eventHashes: windowEvents.map((e) => e.eventHash),
          evidenceBundle: {
            userName,
            srcIp,
            failureCount: inWindowCount,
            windowMinutes: config.windowMinutes,
            firstSeen: windowEvents[0].timestamp,
            lastSeen: windowEvents[windowEvents.length - 1].timestamp,
          },
          timestamp: windowEvents[windowEvents.length - 1].timestamp,
        });

        // Skip past the entire burst (naive: i += inWindow.length - 1; i++)
        i = j + 1;
      } else {
        i++;
      }
    }
  }

  return signals;
}

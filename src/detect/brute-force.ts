import { AuthEvent, Signal } from '../types/auth-event';

export interface BruteForceConfig {
  windowMinutes: number; // default 15
  failureThreshold: number; // default 5
}

/**
 * F5: Sliding-Window Brute Force Detector
 * Catches traditional loud single-IP -> single-account brute-force attacks.
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
    // Sort events by timestamp
    const sorted = [...group].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Sliding window check
    for (let i = 0; i < sorted.length; i++) {
      const windowStartMs = new Date(sorted[i].timestamp).getTime();
      const inWindow = sorted.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= windowStartMs && t <= windowStartMs + windowMs;
      });

      if (inWindow.length >= config.failureThreshold) {
        signals.push({
          id: `sig_f5_${userName}_${srcIp}_${windowStartMs}`,
          detectorId: 'F5_brute',
          detectorFamily: 'VOLUME',
          confidenceScore: Math.min(100, 50 + inWindow.length * 5),
          entityKey: `user:${userName}`,
          eventHashes: inWindow.map((e) => e.eventHash),
          evidenceBundle: {
            userName,
            srcIp,
            failureCount: inWindow.length,
            windowMinutes: config.windowMinutes,
            firstSeen: inWindow[0].timestamp,
            lastSeen: inWindow[inWindow.length - 1].timestamp,
          },
          timestamp: inWindow[inWindow.length - 1].timestamp,
        });

        // Advance index to end of burst to avoid duplicate overlapping signals
        i += inWindow.length - 1;
      }
    }
  }

  return signals;
}

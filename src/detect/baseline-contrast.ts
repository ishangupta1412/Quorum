// F15 supporting module: live baseline comparators for the 45-second demo contrast.
// Pure deterministic TypeScript. Zero external dependencies (detection-plane invariant).

import { AuthEvent } from '../types/auth-event';
import { detectBruteForce } from './brute-force';
import { detectSingleSpray } from './spray-single';

export interface BaselineContrast {
  /** Naive volume SIEM rule: F5 default (>=5 failures per user+IP in 15 min). */
  readonly naiveVolumeAlerts: number;
  /** Loosened threshold rule: F6 loosened (>=2 accounts per IP in 24h). */
  readonly loosenedThresholdAlerts: number;
}

/**
 * Naive volume comparator (Lens 1).
 * Counts F5 brute-force signals at default threshold. Distributed spray legs
 * (<=3 failures per IP) stay beneath this threshold by construction.
 */
export function countNaiveVolumeAlerts(events: readonly AuthEvent[]): number {
  return detectBruteForce(events, { windowMinutes: 15, failureThreshold: 5 }).length;
}

/**
 * Loosened threshold comparator (Lens 2).
 * Counts F6 single-source spray signals with the account fanout floor loosened
 * to 2 accounts per IP. Catches spray legs but also fires on organic noise,
 * demonstrating SOC alert fatigue.
 */
export function countLoosenedThresholdAlerts(events: readonly AuthEvent[]): number {
  return detectSingleSpray(events, {
    windowHours: 24,
    minTargetedAccounts: 2,
    maxFailuresPerAccount: 3,
  }).length;
}

/**
 * Computes both baseline comparator counts live from the loaded corpus.
 * Called on every demo toggle — never cached, never hard-coded (F15).
 */
export function computeBaselineContrast(events: readonly AuthEvent[]): BaselineContrast {
  return {
    naiveVolumeAlerts: countNaiveVolumeAlerts(events),
    loosenedThresholdAlerts: countLoosenedThresholdAlerts(events),
  };
}

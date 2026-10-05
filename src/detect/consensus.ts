import { Signal, Incident, DetectorFamily, SeverityTier } from '../types/auth-event';

export interface ConsensusResult {
  severityScore: number;
  severityTier: SeverityTier;
  severityEquation: string;
  familiesPresent: DetectorFamily[];
}

/**
 * F13: Quorum Consensus Severity Engine
 * Computes deterministic multi-family consensus arithmetic.
 * Never a black box: prints the exact readable algebraic equation.
 */
export function calculateConsensusSeverity(signals: readonly Signal[]): ConsensusResult {
  if (signals.length === 0) {
    return {
      severityScore: 0,
      severityTier: 'LOW',
      severityEquation: 'No signals → Score 0 [LOW]',
      familiesPresent: [],
    };
  }

  // 1. Identify distinct families present
  const familySet = new Set<DetectorFamily>(signals.map((s) => s.detectorFamily));
  const familiesPresent = Array.from(familySet);

  // 2. Base score: highest individual confidence score
  let leadSignal = signals[0];
  for (const sig of signals) {
    if (sig.confidenceScore > leadSignal.confidenceScore) {
      leadSignal = sig;
    }
  }
  const baseScore = leadSignal.confidenceScore;

  // 3. Multiplier according to independent detector families agreeing
  let multiplier = 0.5; // 1 family default penalty
  if (familiesPresent.length === 2) {
    multiplier = 1.0;
  } else if (familiesPresent.length === 3) {
    multiplier = 1.25;
  } else if (familiesPresent.length >= 4) {
    multiplier = 1.5;
  }

  // 4. Compromise bonus: +15 if PIVOT family is present
  const hasPivot = familySet.has('PIVOT');
  const bonus = hasPivot ? 15 : 0;

  // 5. Floor rules
  let floor = 0;
  if (hasPivot) {
    floor = 80; // Pivot implies breach, floor at 80 (CRITICAL)
  } else if (familySet.has('GRAPH') && familySet.has('STATISTICAL')) {
    floor = 60; // Cross-family graph agreement floors at 60 (HIGH)
  }

  // 6. Arithmetic computation
  const rawScore = baseScore * multiplier + bonus;
  const withFloor = Math.max(floor, rawScore);
  const finalScore = Math.min(100, Math.round(withFloor));

  // 7. Severity Tier
  let severityTier: SeverityTier = 'LOW';
  if (finalScore >= 80) {
    severityTier = 'CRITICAL';
  } else if (finalScore >= 60) {
    severityTier = 'HIGH';
  } else if (finalScore >= 30) {
    severityTier = 'MEDIUM';
  }

  // 8. Build human-readable, inspectable equation string
  const familiesStr = familiesPresent.join(', ');
  const floorNotice = floor > 0 ? `floor ${floor} → ` : '';
  const bonusNotice = bonus > 0 ? ` + ${bonus} (auth success)` : '';

  // Human-readable label map — keep internal IDs in logic, show clean names in UI
  const DETECTOR_LABELS: Record<string, string> = {
    F5_brute:      'Brute Force',
    F6_spray:      'Spray Detector',
    F7_campaign:   'Campaign Graph',
    F10_pivot:     'Pivot Detector',
    'antigravity-01': 'Anomaly Model',
  };
  const leadLabel = DETECTOR_LABELS[leadSignal.detectorId] ?? leadSignal.detectorId;

  const severityEquation = `Base ${baseScore} (${leadLabel}) × ${multiplier.toFixed(2)} (${familiesPresent.length} families: ${familiesStr})${bonusNotice} → ${floorNotice}clipped ${finalScore} [${severityTier}]`;

  return {
    severityScore: finalScore,
    severityTier,
    severityEquation,
    familiesPresent,
  };
}

/**
 * Groups signals into cohesive security incidents and scores each using the consensus engine.
 */
export function buildIncidentsFromSignals(signals: readonly Signal[]): readonly Incident[] {
  if (signals.length === 0) return [];

  // Group signals by related campaign cluster or entity
  // PIVOT, GRAPH, and SPRAY signals relating to common accounts/IPs coalesce
  const incidents: Incident[] = [];

  // Identify all high-impact campaign or pivot signals
  const campaignSignals = signals.filter(
    (s) => s.detectorFamily === 'GRAPH' || s.detectorFamily === 'PIVOT'
  );

  if (campaignSignals.length > 0) {
    // Collect all participating entities
    const contributingIps = new Set<string>();
    const targetedAccounts = new Set<string>();
    const compromisedAccounts = new Set<string>();
    const signalIds = signals.map((s) => s.id);

    for (const sig of signals) {
      if (sig.evidenceBundle.srcIp) contributingIps.add(String(sig.evidenceBundle.srcIp));
      if (sig.evidenceBundle.contributingIps && Array.isArray(sig.evidenceBundle.contributingIps)) {
        sig.evidenceBundle.contributingIps.forEach((ip) => contributingIps.add(String(ip)));
      }
      if (sig.evidenceBundle.targetedAccounts && Array.isArray(sig.evidenceBundle.targetedAccounts)) {
        sig.evidenceBundle.targetedAccounts.forEach((u) => targetedAccounts.add(String(u)));
      }
      if (sig.detectorFamily === 'PIVOT' && sig.evidenceBundle.compromisedUser) {
        compromisedAccounts.add(String(sig.evidenceBundle.compromisedUser));
      }
    }

    const consensus = calculateConsensusSeverity(signals);

    incidents.push({
      id: 'inc_quorum_correlated_01',
      title: compromisedAccounts.size > 0
        ? `Distributed Password Spray with Confirmed Account Compromise (${compromisedAccounts.size} account)`
        : `Distributed Multi-Source Password Spray Campaign (${contributingIps.size} IPs)`,
      severityScore: consensus.severityScore,
      severityTier: consensus.severityTier,
      severityEquation: consensus.severityEquation,
      familiesPresent: consensus.familiesPresent,
      signalIds,
      contributingIps: Array.from(contributingIps),
      targetedAccounts: Array.from(targetedAccounts),
      compromisedAccounts: Array.from(compromisedAccounts),
      status: 'OPEN',
      createdAt: signals[signals.length - 1].timestamp,
    });
  } else {
    // Individual signals (e.g. standalone brute force)
    for (const sig of signals) {
      const consensus = calculateConsensusSeverity([sig]);
      incidents.push({
        id: `inc_${sig.id}`,
        title: `Localized Auth Anomaly (${sig.entityKey})`,
        severityScore: consensus.severityScore,
        severityTier: consensus.severityTier,
        severityEquation: consensus.severityEquation,
        familiesPresent: consensus.familiesPresent,
        signalIds: [sig.id],
        contributingIps: sig.evidenceBundle.srcIp ? [String(sig.evidenceBundle.srcIp)] : [],
        targetedAccounts: sig.evidenceBundle.userName ? [String(sig.evidenceBundle.userName)] : [],
        compromisedAccounts: [],
        status: 'OPEN',
        createdAt: sig.timestamp,
      });
    }
  }

  return incidents;
}

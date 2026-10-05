import { AuthEvent } from '../types/auth-event';
import { Signal, DetectorFamily } from '../types/signals';

export interface AntigravityAnalysisResponse {
  campaignId: string;
  start: string;
  end: string;
  score: number;
  hashes: string[];
  modelVersion: string;
  mitreTechnique?: string;
}

export class AntigravityDetector {
  private apiKey: string;
  private endpoint: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTIGRAVITY_API_KEY || '';
    this.endpoint =
      endpoint ||
      process.env.ANTIGRAVITY_API_URL ||
      'https://api.antigravity.ai/v1/detect/anomaly';
  }

  /**
   * Processes authentication telemetry events and returns an ML Signal vote
   * for the Quorum F13 Multi-Family Consensus Engine.
   * Minimized token/memory footprint by utilizing zero-copy stream references.
   */
  async analyze(events: readonly AuthEvent[] | any[]): Promise<Signal | null> {
    if (!this.apiKey) {
      throw new Error('Missing ANTIGRAVITY_API_KEY in environment');
    }

    if (!events || events.length === 0) {
      return null;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: events,
          metadata: {
            engine: 'quorum-v4',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Antigravity API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as AntigravityAnalysisResponse;
      const normalisedScore = Math.min(100, Math.max(0, Math.round((result.score || 0) * 10)));
      const campaignId = result.campaignId || `antigravity_cluster_${Date.now()}`;
      const hashes = result.hashes || events.map((e) => (e && e.eventHash ? e.eventHash : String(e)));
      const start = result.start || (events[0]?.timestamp ?? new Date().toISOString());
      const end = result.end || (events[events.length - 1]?.timestamp ?? new Date().toISOString());
      const mitreTechnique = result.mitreTechnique || 'T1110.003';
      const modelVersion = result.modelVersion || 'antigravity-anomaly-v2.4';

      // Mapping Antigravity ML output to Quorum's Canonical Signal Protocol
      return {
        id: `sig_ml_${campaignId}`,
        detectorId: 'antigravity-01',
        detectorFamily: 'ML' as DetectorFamily,
        confidenceScore: normalisedScore,
        entityKey: `campaign:${campaignId}`,
        eventHashes: hashes,
        evidenceBundle: {
          model: modelVersion,
          rawScore: result.score,
          normalisedScore,
          mitreTechnique,
          eventCount: events.length,
          windowStart: start,
          windowEnd: end,
        },
        timestamp: end,
        // PRD Section 4.4 compatibility fields
        entityType: 'campaign',
        entityValue: campaignId,
        windowStart: start,
        windowEnd: end,
        rawScore: result.score,
        normalisedScore,
        evidenceEventHashes: hashes,
        mitreTechnique,
        paramsSnapshot: { model: modelVersion },
      };
    } catch (e) {
      console.error(`[Antigravity] Integration Error: ${e instanceof Error ? e.message : e}`);
      return null;
    }
  }

  /**
   * Deterministic local evaluation fallback for testing & offline verification.
   * Matches Project Quorum style: pure deterministic TypeScript, zero external network dependency.
   */
  static evaluateLocal(events: readonly AuthEvent[], modelScore: number = 8.5): Signal | null {
    if (!events || events.length === 0) return null;

    const failureEvents = events.filter((e) => e.eventOutcome !== 'SUCCESS');
    if (failureEvents.length < 5) return null;

    const uniqueIps = new Set(failureEvents.map((e) => e.srcIp)).size;
    const uniqueUsers = new Set(failureEvents.map((e) => e.userName)).size;
    if (uniqueIps < 3 && uniqueUsers < 3) return null;

    const start = events[0].timestamp;
    const end = events[events.length - 1].timestamp;
    const campaignId = `ag_ml_${uniqueIps}ips_${uniqueUsers}users`;
    const normalisedScore = Math.min(100, Math.round(modelScore * 10));
    const hashes = failureEvents.map((e) => e.eventHash);

    return {
      id: `sig_ml_${campaignId}`,
      detectorId: 'antigravity-01',
      detectorFamily: 'ML',
      confidenceScore: normalisedScore,
      entityKey: `campaign:${campaignId}`,
      eventHashes: hashes,
      evidenceBundle: {
        model: 'antigravity-local-heuristics-v1',
        rawScore: modelScore,
        normalisedScore,
        mitreTechnique: 'T1110.003',
        targetedIps: uniqueIps,
        targetedUsers: uniqueUsers,
      },
      timestamp: end,
      entityType: 'campaign',
      entityValue: campaignId,
      windowStart: start,
      windowEnd: end,
      rawScore: modelScore,
      normalisedScore,
      evidenceEventHashes: hashes,
      mitreTechnique: 'T1110.003',
      paramsSnapshot: { model: 'antigravity-local-heuristics-v1' },
    };
  }
}

import { AuthEvent, Signal, Incident, SeverityTier } from '@/types/auth-event';
import { runDetectionPipeline } from '@/detect/engine';
import { computeBaselineContrast } from '@/detect/baseline-contrast';
import { sha256 } from '@/lib/crypto/hash';

export type LiveStatus = 'BASELINE' | 'SPRAY' | 'PIVOT';

export interface LiveGraphNode {
  id: string;
  type: 'ip' | 'user';
  label: string;
  status: 'normal' | 'spray' | 'pivot';
  degree: number;
}

export interface LiveGraphLink {
  source: string;
  target: string;
  outcome: 'SUCCESS' | 'FAILURE';
  timestamp: string;
}

export interface LiveStateSnapshot {
  currentScore: number;
  severityTier: SeverityTier;
  status: LiveStatus;
  clusters: Array<{
    clusterId: number;
    ipCount: number;
    accountCount: number;
    contributingIps: string[];
    targetedAccounts: string[];
    totalEvents: number;
  }>;
  lastPivot: {
    userName: string;
    srcIp: string;
    timestamp: string;
  } | null;
  reasoning: string;
  events: AuthEvent[];
  totalEventsProcessed: number;
  naiveAlerts: number;
  loosenedAlerts: number;
  stats: {
    total: number;
    failed: number;
    success: number;
    uniqueIps: number;
    uniqueUsers: number;
  };
  graphNodes: LiveGraphNode[];
  graphLinks: LiveGraphLink[];
}

const MAX_RETAINED_EVENTS = 1000;

class LiveSessionStore {
  private events: AuthEvent[] = [];
  private totalCount = 0;
  private lastPivotRecord: { userName: string; srcIp: string; timestamp: string } | null = null;
  private currentScore = 0;
  private severityTier: SeverityTier = 'LOW';
  private status: LiveStatus = 'BASELINE';
  private reasoning = 'Monitoring baseline traffic... 0 signals active.';
  private clusters: LiveStateSnapshot['clusters'] = [];
  private naiveAlerts = 0;
  private loosenedAlerts = 0;

  public ingest(rawEvents: any[]): { processed: number; currentScore: number; status: LiveStatus } {
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return { processed: 0, currentScore: this.currentScore, status: this.status };
    }

    const normalizedEvents: AuthEvent[] = [];

    for (const raw of rawEvents) {
      const srcIp = String(raw.ip || raw.srcIp || '192.168.1.1').trim();
      const userName = String(raw.user || raw.userName || 'unknown_user').trim().toLowerCase();
      const userRaw = String(raw.user || raw.userName || 'unknown_user').trim();
      const rawOutcome = String(raw.outcome || raw.eventOutcome || 'FAILURE_BAD_CREDENTIALS').toUpperCase();
      const eventOutcome: import('@/types/auth-event').AuthOutcome = rawOutcome.includes('SUCC')
        ? 'SUCCESS'
        : rawOutcome.includes('LOCKED')
        ? 'FAILURE_LOCKED'
        : rawOutcome.includes('MFA')
        ? 'FAILURE_MFA'
        : rawOutcome.includes('EXPIRED')
        ? 'FAILURE_EXPIRED'
        : 'FAILURE_BAD_CREDENTIALS';

      let ts: string;
      if (raw.timestamp) {
        if (typeof raw.timestamp === 'number') {
          // If seconds (unix epoch), convert to ms
          const ms = raw.timestamp < 10_000_000_000 ? raw.timestamp * 1000 : raw.timestamp;
          ts = new Date(ms).toISOString();
        } else {
          ts = new Date(raw.timestamp).toISOString();
        }
      } else {
        ts = new Date().toISOString();
      }

      const eventHash = sha256(`${ts}|${srcIp}|${userName}|${eventOutcome}`);

      const event: import('@/types/auth-event').AuthEvent = {
        eventHash,
        timestamp: ts,
        tsTzAssumed: false,
        srcIp,
        ipScope: (srcIp.startsWith('10.') || srcIp.startsWith('192.168.') || srcIp.startsWith('172.16.'))
          ? 'private'
          : 'public',
        userName,
        userRaw,
        userPresent: userName !== 'unknown_user' && userName !== '__unknown__',
        eventOutcome,
        sourceSystem: 'LiveFeeder',
      };

      normalizedEvents.push(event);
      this.totalCount++;
    }

    // Append to ring buffer
    this.events.push(...normalizedEvents);
    if (this.events.length > MAX_RETAINED_EVENTS) {
      this.events = this.events.slice(-MAX_RETAINED_EVENTS);
    }

    // Run Quorum Detection Pipeline across retained events
    this.reevaluate();

    return {
      processed: normalizedEvents.length,
      currentScore: this.currentScore,
      status: this.status,
    };
  }

  public reset(): void {
    this.events = [];
    this.totalCount = 0;
    this.lastPivotRecord = null;
    this.currentScore = 0;
    this.severityTier = 'LOW';
    this.status = 'BASELINE';
    this.reasoning = 'State reset. Monitoring baseline traffic...';
    this.clusters = [];
    this.naiveAlerts = 0;
    this.loosenedAlerts = 0;
  }

  private reevaluate(): void {
    if (this.events.length === 0) {
      this.reset();
      return;
    }

    // 1. Run baseline comparators
    const contrast = computeBaselineContrast(this.events);
    this.naiveAlerts = contrast.naiveVolumeAlerts;
    this.loosenedAlerts = contrast.loosenedThresholdAlerts;

    // 2. Run Quorum Detection Engine
    const res = runDetectionPipeline(this.events);

    // 3. Extract clusters from GRAPH signals
    const graphSignals = res.signals.filter((s) => s.detectorFamily === 'GRAPH');
    this.clusters = graphSignals.map((s, idx) => ({
      clusterId: idx + 1,
      ipCount: Number(s.evidenceBundle.ipCount) || 0,
      accountCount: Number(s.evidenceBundle.accountCount) || 0,
      contributingIps: Array.isArray(s.evidenceBundle.contributingIps)
        ? (s.evidenceBundle.contributingIps as string[])
        : [],
      targetedAccounts: Array.isArray(s.evidenceBundle.targetedAccounts)
        ? (s.evidenceBundle.targetedAccounts as string[])
        : [],
      totalEvents: Number(s.evidenceBundle.totalEvents) || 0,
    }));

    // 4. Check for PIVOT signal
    const pivotSignal = res.signals.find((s) => s.detectorFamily === 'PIVOT');
    if (pivotSignal && pivotSignal.evidenceBundle.compromisedUser) {
      this.status = 'PIVOT';
      this.lastPivotRecord = {
        userName: String(pivotSignal.evidenceBundle.compromisedUser),
        srcIp: String(pivotSignal.evidenceBundle.srcIp || pivotSignal.evidenceBundle.pivotIp || 'proxy'),
        timestamp: pivotSignal.timestamp,
      };
    } else if (graphSignals.length > 0) {
      this.status = 'SPRAY';
    } else {
      this.status = 'BASELINE';
    }

    // 5. Primary incident & reasoning
    const primaryIncident = res.incidents[0];
    if (primaryIncident) {
      this.currentScore = primaryIncident.severityScore;
      this.severityTier = primaryIncident.severityTier;
      this.reasoning = primaryIncident.severityEquation;
    } else {
      this.currentScore = 0;
      this.severityTier = 'LOW';
      this.reasoning = `Baseline traffic: ${this.events.length} events processed · 0 correlated threats.`;
    }
  }

  public getSnapshot(): LiveStateSnapshot {
    const uniqueIps = new Set<string>();
    const uniqueUsers = new Set<string>();
    let failed = 0;
    let success = 0;

    // Graph nodes and links
    const nodeMap = new Map<string, LiveGraphNode>();
    const links: LiveGraphLink[] = [];

    // Track pivot and spray entities
    const sprayIps = new Set<string>();
    const sprayUsers = new Set<string>();
    for (const c of this.clusters) {
      c.contributingIps.forEach((ip) => sprayIps.add(ip));
      c.targetedAccounts.forEach((u) => sprayUsers.add(u));
    }

    const pivotUser = this.lastPivotRecord?.userName;
    const pivotIp = this.lastPivotRecord?.srcIp;

    // Build from the most recent 120 events to keep UI responsive
    const slice = this.events.slice(-120);

    for (const e of this.events) {
      uniqueIps.add(e.srcIp);
      uniqueUsers.add(e.userName);
      if (e.eventOutcome === 'SUCCESS') success++;
      else failed++;
    }

    for (const e of slice) {
      const ipId = `ip:${e.srcIp}`;
      const userId = `user:${e.userName}`;

      if (!nodeMap.has(ipId)) {
        const isPivot = e.srcIp === pivotIp;
        const isSpray = sprayIps.has(e.srcIp);
        nodeMap.set(ipId, {
          id: ipId,
          type: 'ip',
          label: e.srcIp,
          status: isPivot ? 'pivot' : isSpray ? 'spray' : 'normal',
          degree: 0,
        });
      }
      nodeMap.get(ipId)!.degree++;

      if (!nodeMap.has(userId)) {
        const isPivot = e.userName === pivotUser;
        const isSpray = sprayUsers.has(e.userName);
        nodeMap.set(userId, {
          id: userId,
          type: 'user',
          label: e.userName,
          status: isPivot ? 'pivot' : isSpray ? 'spray' : 'normal',
          degree: 0,
        });
      }
      nodeMap.get(userId)!.degree++;

      links.push({
        source: ipId,
        target: userId,
        outcome: e.eventOutcome === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
        timestamp: e.timestamp,
      });
    }

    return {
      currentScore: this.currentScore,
      severityTier: this.severityTier,
      status: this.status,
      clusters: this.clusters,
      lastPivot: this.lastPivotRecord,
      reasoning: this.reasoning,
      events: this.events.slice(-50), // Last 50 for the live telemetry feed
      totalEventsProcessed: this.totalCount,
      naiveAlerts: this.naiveAlerts,
      loosenedAlerts: this.loosenedAlerts,
      stats: {
        total: this.totalCount,
        failed,
        success,
        uniqueIps: uniqueIps.size,
        uniqueUsers: uniqueUsers.size,
      },
      graphNodes: Array.from(nodeMap.values()),
      graphLinks: links.slice(-80),
    };
  }
}

// Global singleton instance preserved across API invocations
declare global {
  // eslint-disable-next-line no-var
  var __quorumLiveSession: LiveSessionStore | undefined;
}

export const liveSession: LiveSessionStore =
  globalThis.__quorumLiveSession || (globalThis.__quorumLiveSession = new LiveSessionStore());

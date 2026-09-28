import { AuthEvent, Signal } from '../types/auth-event';

export interface CampaignGraphConfig {
  minIps: number; // default 5 (to catch distributed sprays)
  minAccounts: number; // default 15
  windowHours: number; // default 72 hours (3 days)
}

/**
 * Disjoint Set (Union-Find) with path compression and rank optimization.
 */
class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      this.rank.set(item, 0);
      return item;
    }
    let root = item;
    while (root !== this.parent.get(root)!) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let curr = item;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }

  getAllNodes(): string[] {
    return Array.from(this.parent.keys());
  }
}

/**
 * F7: Bipartite Campaign Graph (Union-Find)
 * Flagship algorithm: Detects low-and-slow distributed password spray campaigns
 * across residential proxies where individual IPs make too few attempts for traditional rules.
 */
export function detectCampaignGraph(
  events: readonly AuthEvent[],
  config: CampaignGraphConfig = {
    minIps: 5,
    minAccounts: 15,
    windowHours: 72,
  }
): readonly Signal[] {
  const windowMs = config.windowHours * 3600 * 1000;
  const signals: Signal[] = [];

  // Filter to auth failures with valid users and public IPs
  const failureEvents = events.filter(
    (e) =>
      e.eventOutcome !== 'SUCCESS' &&
      e.userPresent &&
      e.userName !== '__unknown__'
  );

  if (failureEvents.length === 0) return [];

  // Sort events by timestamp
  const sorted = [...failureEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const uf = new UnionFind();
  const eventHashesByComponent = new Map<string, string[]>();
  const timestampsByComponent = new Map<string, string[]>();

  // Add edges to bipartite graph: IP <-> USER
  for (const event of sorted) {
    const ipNode = `ip:${event.srcIp}`;
    const userNode = `user:${event.userName}`;

    uf.union(ipNode, userNode);
  }

  // Group connected nodes by their root component
  const components = new Map<string, { ips: Set<string>; users: Set<string> }>();

  for (const node of uf.getAllNodes()) {
    const root = uf.find(node);
    if (!components.has(root)) {
      components.set(root, { ips: new Set(), users: new Set() });
    }
    const comp = components.get(root)!;
    if (node.startsWith('ip:')) {
      comp.ips.add(node.slice(3));
    } else if (node.startsWith('user:')) {
      comp.users.add(node.slice(5));
    }
  }

  // Map events to root components
  for (const event of sorted) {
    const root = uf.find(`ip:${event.srcIp}`);
    const hashes = eventHashesByComponent.get(root) || [];
    hashes.push(event.eventHash);
    eventHashesByComponent.set(root, hashes);

    const tList = timestampsByComponent.get(root) || [];
    tList.push(event.timestamp);
    timestampsByComponent.set(root, tList);
  }

  let clusterIndex = 1;
  for (const [root, comp] of components.entries()) {
    if (comp.ips.size >= config.minIps && comp.users.size >= config.minAccounts) {
      const hashes = eventHashesByComponent.get(root) || [];
      const times = timestampsByComponent.get(root) || [];
      const latestTime = times.length > 0 ? times[times.length - 1] : new Date().toISOString();

      signals.push({
        id: `sig_f7_campaign_cluster_${clusterIndex}`,
        detectorId: 'F7_campaign',
        detectorFamily: 'GRAPH',
        confidenceScore: Math.min(100, 75 + comp.ips.size * 2),
        entityKey: `cluster:${root}`,
        eventHashes: hashes,
        evidenceBundle: {
          clusterId: clusterIndex,
          ipCount: comp.ips.size,
          contributingIps: Array.from(comp.ips).slice(0, 100),
          accountCount: comp.users.size,
          targetedAccounts: Array.from(comp.users).slice(0, 100),
          totalEvents: hashes.length,
          densityRatio: Math.round((hashes.length / (comp.ips.size * comp.users.size)) * 1000) / 1000,
        },
        timestamp: latestTime,
      });

      clusterIndex++;
    }
  }

  return signals;
}

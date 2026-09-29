import { describe, it, expect } from './test-helper';
import { generateSyntheticCorpus } from '../src/data/generator';
import { runDetectionPipeline } from '../src/detect/engine';
import { detectBruteForce } from '../src/detect/brute-force';
import { detectCampaignGraph } from '../src/detect/campaign-graph';
import { calculateConsensusSeverity } from '../src/detect/consensus';
import { Signal } from '../src/types/auth-event';

describe('Quorum Detection Plane', () => {
  const corpus = generateSyntheticCorpus({ userCount: 100, pack: 'B' });

  it('generates deterministic synthetic corpus with expected benign and attack mix', () => {
    expect(corpus.events.length).toBeGreaterThan(200);
    expect(corpus.stats.compromisedUser).toBeDefined();
    expect(corpus.stats.sprayIps.length).toBe(12);
  });

  it('F5: detects single-source high volume brute-force burst', () => {
    const bruteSignals = detectBruteForce(corpus.events);
    expect(bruteSignals.length).toBeGreaterThanOrEqual(1);
    const lead = bruteSignals[0];
    expect(lead.detectorFamily).toBe('VOLUME');
    expect(lead.detectorId).toBe('F5_brute');
  });

  it('F7: identifies the distributed password spray campaign using bipartite graph Union-Find', () => {
    const campaignSignals = detectCampaignGraph(corpus.events, {
      minIps: 5,
      minAccounts: 15,
      windowHours: 72,
    });

    expect(campaignSignals.length).toBeGreaterThanOrEqual(1);
    const campaign = campaignSignals[0];
    expect(campaign.detectorFamily).toBe('GRAPH');
    expect(campaign.detectorId).toBe('F7_campaign');
    expect(campaign.confidenceScore).toBeGreaterThanOrEqual(80);

    const bundle = campaign.evidenceBundle as Record<string, unknown>;
    expect(Number(bundle.ipCount)).toBeGreaterThanOrEqual(5);
    expect(Number(bundle.accountCount)).toBeGreaterThanOrEqual(15);
  });

  it('F13: calculates multi-family consensus severity correctly', () => {
    const mockSignals: Signal[] = [
      {
        id: 's1',
        detectorId: 'F7_campaign',
        detectorFamily: 'GRAPH',
        confidenceScore: 90,
        entityKey: 'cluster:1',
        eventHashes: [],
        evidenceBundle: {},
        timestamp: '2026-09-28T12:00:00Z',
      },
      {
        id: 's2',
        detectorId: 'F10_pivot',
        detectorFamily: 'PIVOT',
        confidenceScore: 100,
        entityKey: 'user:user_0001',
        eventHashes: [],
        evidenceBundle: {},
        timestamp: '2026-09-28T13:00:00Z',
      },
    ];

    const result = calculateConsensusSeverity(mockSignals);
    expect(result.severityScore).toBe(100);
    expect(result.severityTier).toBe('CRITICAL');
    expect(result.severityEquation).toContain('Base 100 (F10_pivot)');
    expect(result.severityEquation).toContain('2 families');
  });

  it('Full Pipeline: executes end-to-end and produces 1 Correlated Critical Incident', () => {
    const result = runDetectionPipeline(corpus.events);

    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.incidents.length).toBeGreaterThan(0);

    const criticalIncidents = result.incidents.filter((inc) => inc.severityTier === 'CRITICAL');
    expect(criticalIncidents.length).toBeGreaterThanOrEqual(1);

    const mainIncident = criticalIncidents[0];
    expect(mainIncident.compromisedAccounts.length).toBeGreaterThan(0);
    expect(mainIncident.familiesPresent).toContain('GRAPH');
    expect(mainIncident.familiesPresent).toContain('PIVOT');
  });
});

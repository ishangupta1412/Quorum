import { describe, it, expect } from './test-helper';
import { generateSyntheticCorpus } from '../src/data/generator';
import {
  countNaiveVolumeAlerts,
  countLoosenedThresholdAlerts,
  computeBaselineContrast,
} from '../src/detect/baseline-contrast';

describe('F15 Baseline Contrast Comparators (live, never hard-coded)', () => {
  it('Pack A (benign) produces zero baseline alerts on both comparators', () => {
    const packA = generateSyntheticCorpus({ userCount: 100, pack: 'A' });
    expect(countNaiveVolumeAlerts(packA.events)).toBe(0);
    expect(countLoosenedThresholdAlerts(packA.events)).toBe(0);
  });

  it('Pack B detects the brute-force decoy on naive and spray legs on loosened', () => {
    const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const contrast = computeBaselineContrast(packB.events);
    expect(contrast.naiveVolumeAlerts).toBeGreaterThanOrEqual(1);
    expect(contrast.loosenedThresholdAlerts).toBeGreaterThanOrEqual(1);
    expect(contrast.loosenedThresholdAlerts).toBeGreaterThan(contrast.naiveVolumeAlerts);
  });

  it('Comparator output is deterministic across reruns', () => {
    const first = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const second = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    expect(computeBaselineContrast(first.events)).toEqual(
      computeBaselineContrast(second.events)
    );
  });

  it('pins exact measured contrast on the seeded Pack B corpus', () => {
    const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const contrast = computeBaselineContrast(packB.events);
    expect(contrast.naiveVolumeAlerts).toBe(1);
    expect(contrast.loosenedThresholdAlerts).toBe(12);
  });

  it('Empty corpus yields zero alerts without throwing', () => {
    expect(computeBaselineContrast([])).toEqual({
      naiveVolumeAlerts: 0,
      loosenedThresholdAlerts: 0,
    });
  });
});

import { describe, it, expect } from './test-helper';
import { generateSyntheticCorpus } from '../src/data/generator';
import { runDetectionPipeline } from '../src/detect/engine';
import {
  CSV_HEADER,
  escapeCsvField,
  exportIncidentToCsv,
  exportIncidentsToCsv,
} from '../src/lib/export/csv';

describe('F25C Deterministic CSV Exporter', () => {
  it('emits the fixed header plus one data row per incident', () => {
    const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const result = runDetectionPipeline(packB.events);
    expect(result.incidents.length).toBeGreaterThan(0);

    const csv = exportIncidentToCsv(result.incidents[0]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(CSV_HEADER);
    expect(lines.length).toBe(2);
    expect(csv).toContain(result.incidents[0].severityEquation);
    expect(csv).toContain('[CRITICAL]');
  });

  it('batch export preserves input order with one row per incident', () => {
    const packB = generateSyntheticCorpus({ userCount: 100, pack: 'B' });
    const result = runDetectionPipeline(packB.events);
    const csv = exportIncidentsToCsv(result.incidents);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(CSV_HEADER);
    expect(lines.length).toBe(result.incidents.length + 1);
  });

  it('escapes commas, quotes, and newlines per RFC 4180', () => {
    expect(escapeCsvField('plain')).toBe('plain');
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('export output is byte-identical across reruns', () => {
    const first = runDetectionPipeline(
      generateSyntheticCorpus({ userCount: 100, pack: 'B' }).events
    );
    const second = runDetectionPipeline(
      generateSyntheticCorpus({ userCount: 100, pack: 'B' }).events
    );
    expect(exportIncidentsToCsv(first.incidents)).toBe(
      exportIncidentsToCsv(second.incidents)
    );
  });
});

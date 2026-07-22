import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  buildReport,
  readManifest,
  type LabReport,
  type SimulationResult,
} from './cache-reuse-simulator';

const manifestUrl = new URL('./cache-workload.json', import.meta.url);

const resultById = (report: LabReport, configId: string): SimulationResult => {
  const result = report.results.find((item) => item.configId === configId);
  if (!result) throw new Error(`missing simulator result: ${configId}`);
  return result;
};

describe('deterministic cache reuse simulator', () => {
  it('replays the same manifest to the same structured report', () => {
    const first = buildReport(readManifest(manifestUrl.pathname));
    const second = buildReport(readManifest(manifestUrl.pathname));

    expect(second).toEqual(first);
    expect(first.schemaVersion).toBe('cache-lab-report/v1');
  });

  it('passes every built-in safety and recovery assertion', () => {
    const report = buildReport(readManifest(manifestUrl.pathname));
    const failed = report.assertions.filter((assertion) => !assertion.passed);

    expect(failed).toEqual([]);
    expect(report.assertions.map((assertion) => assertion.id)).toContain(
      'burst-singleflight-one-fill',
    );
    expect(report.assertions.map((assertion) => assertion.id)).toContain(
      'permission-tighten-safe-miss',
    );
    expect(report.assertions.map((assertion) => assertion.id)).toContain(
      'fill-owner-crash-recovers-with-fence',
    );
  });

  it('shows that coalescing removes fill amplification without serving unsafe hits', () => {
    const report = buildReport(readManifest(manifestUrl.pathname));
    const safe = resultById(report, 'lru-singleflight-safe');
    const naive = resultById(report, 'lru-naive');

    expect(safe.metrics.fillAmplification).toBeLessThan(naive.metrics.fillAmplification);
    expect(safe.metrics.originCalls).toBeLessThan(naive.metrics.originCalls);
    expect(safe.metrics.unsafeHits).toBe(0);
    expect(naive.metrics.unsafeHits).toBeGreaterThan(0);
  });

  it('keeps admission and eviction measurable as different decisions', () => {
    const report = buildReport(readManifest(manifestUrl.pathname));
    const lru = resultById(report, 'lru-singleflight-safe');
    const admitted = resultById(report, 'frequency-admission-safe');

    expect(admitted.metrics.admissionRejects).toBeGreaterThan(0);
    expect(admitted.metrics.evictions).toBeLessThan(lru.metrics.evictions);
    expect(admitted.metrics.computeSavedRatio).toBeGreaterThanOrEqual(
      lru.metrics.computeSavedRatio,
    );
  });

  it('counts semantic false hits separately instead of hiding them in hit rate', () => {
    const report = buildReport(readManifest(manifestUrl.pathname));
    const control = resultById(report, 'semantic-negative-control');

    expect(control.metrics.semanticFalseHits).toBe(1);
    expect(control.metrics.unsafeHits).toBeGreaterThanOrEqual(
      control.metrics.semanticFalseHits,
    );
    expect(control.metrics.safeRequestHitRate).toBeLessThan(
      control.metrics.requestHitRate,
    );
  });

  it('keeps the checked-in workload valid JSON for independent inspection', () => {
    expect(() => JSON.parse(readFileSync(manifestUrl, 'utf8'))).not.toThrow();
  });
});

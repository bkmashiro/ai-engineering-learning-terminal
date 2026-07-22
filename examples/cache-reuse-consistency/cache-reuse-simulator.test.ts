import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import {
  buildReport,
  parseCli,
  readManifest,
  runCli,
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

  it('keeps Origin attempt accounting closed, including fenced late fills', () => {
    const report = buildReport(readManifest(manifestUrl.pathname));

    for (const result of report.results) {
      expect(result.metrics.originSuccesses + result.metrics.originFailures).toBe(
        result.metrics.originCalls,
      );
    }
  });

  it('uses the checked-in workload when no manifest flag is provided', () => {
    const options = parseCli([]);

    expect(options.manifestPath).toBe(fileURLToPath(manifestUrl));
    expect(existsSync(options.manifestPath)).toBe(true);
  });

  it('prints help and exits successfully without reading a requested manifest', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(runCli(['--manifest', '/definitely/missing/cache-manifest.json', '--help'])).toBe(0);
      const output = log.mock.calls.flat().join('\n');
      expect(output).toContain('Usage:');
      expect(output).not.toContain('Assertions:');
      expect(error).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
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

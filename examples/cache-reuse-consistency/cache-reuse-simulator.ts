/*
 * 确定性缓存实验：无外部依赖、无真实网络、无真实模型。
 *
 * 在项目根目录运行：
 *   pnpm exec tsx examples/cache-reuse-consistency/cache-reuse-simulator.ts \
 *     --manifest examples/cache-reuse-consistency/cache-workload.json \
 *     --out artifacts/cache-reuse/report.json \
 *     --markdown artifacts/cache-reuse/report.md \
 *     --self-test
 *
 * Node.js 22+ 也可直接执行自检：
 *   node --experimental-strip-types examples/cache-reuse-consistency/cache-reuse-simulator.ts \
 *     --manifest examples/cache-reuse-consistency/cache-workload.json --self-test
 *
 * 所有延迟、字节与 Compute Unit 都由 Manifest 明确定义，只用于比较策略，
 * 不代表任何厂商或生产系统的性能。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

type CachePolicy = 'none' | 'lru' | 'frequency-admission';
type SemanticMode = 'off' | 'unsafe';

type Primitive = string | number | boolean;

interface ResourceState {
  id: string;
  generation: number;
  permissionRevision: number;
  modelRevision: string;
  tokenizerRevision: string;
  adapterRevision: string;
  multimodalHash: string;
  cacheSalt: string;
  bytes: number;
  computeUnits: number;
  originLatencyMs: number;
  answerId: string;
  exists: boolean;
}

interface CacheConfig {
  id: string;
  description: string;
  policy: CachePolicy;
  capacityBytes: number;
  ttlMs: number;
  staleWhileRevalidateMs: number;
  staleIfErrorMs: number;
  singleflight: boolean;
  completeIdentity: boolean;
  validateOnRead: boolean;
  validatePayload: boolean;
  leaseFencing: boolean;
  semanticMode: SemanticMode;
}

interface RequestEvent {
  kind: 'request';
  at: number;
  id: string;
  cohortId: string;
  resourceId: string;
  semanticGroup?: string;
  count: number;
  tenantId: string;
  principalScope: string;
}

interface MutateEvent {
  kind: 'mutate';
  at: number;
  resourceId: string;
  patch: Partial<ResourceState>;
}

interface OutageStartEvent {
  kind: 'outage-start';
  at: number;
}

interface OutageEndEvent {
  kind: 'outage-end';
  at: number;
}

interface CrashNextFillEvent {
  kind: 'crash-next-fill';
  at: number;
  resourceId: string;
}

interface PoisonEvent {
  kind: 'poison';
  at: number;
  resourceId: string;
  tenantId: string;
  principalScope: string;
}

type ManifestEvent =
  | RequestEvent
  | MutateEvent
  | OutageStartEvent
  | OutageEndEvent
  | CrashNextFillEvent
  | PoisonEvent;

export interface Manifest {
  schemaVersion: string;
  description: string;
  lookupLatencyMs: number;
  originFailureLatencyMs: number;
  leaseMs: number;
  resources: ResourceState[];
  configs: CacheConfig[];
  events: ManifestEvent[];
}

interface IdentitySnapshot {
  tenantId: string;
  principalScope: string;
  generation: number;
  permissionRevision: number;
  modelRevision: string;
  tokenizerRevision: string;
  adapterRevision: string;
  multimodalHash: string;
  cacheSalt: string;
}

interface CacheEntry extends IdentitySnapshot {
  key: string;
  sourceResourceId: string;
  answerId: string;
  exists: boolean;
  sizeBytes: number;
  computeUnits: number;
  createdAt: number;
  freshUntil: number;
  staleUntil: number;
  lastAccessAt: number;
  integrityHash: string;
  fence: number;
}

interface RequestWaiter {
  event: RequestEvent;
  requestResource: ResourceState;
  key: string;
}

interface InFlight {
  key: string;
  fence: number;
  waiters: RequestWaiter[];
  sourceSnapshot: ResourceState;
  identity: IdentitySnapshot;
  cohortId: string;
  startedAt: number;
  background: boolean;
  recovering: boolean;
}

interface FillCompleteEvent {
  kind: 'fill-complete';
  at: number;
  order: number;
  key: string;
  fence: number;
  callCount: number;
  sourceSnapshot: ResourceState;
  identity: IdentitySnapshot;
  waiters: RequestWaiter[];
  cohortId: string;
  background: boolean;
  singleflightKey?: string;
}

interface FillFailureEvent {
  kind: 'fill-failure';
  at: number;
  order: number;
  key: string;
  fence: number;
  callCount: number;
  waiters: RequestWaiter[];
  cohortId: string;
  singleflightKey?: string;
}

interface LeaseRecoveryEvent {
  kind: 'lease-recovery';
  at: number;
  order: number;
  key: string;
  fence: number;
}

interface LateFillEvent {
  kind: 'late-fill';
  at: number;
  order: number;
  key: string;
  fence: number;
  sourceSnapshot: ResourceState;
  identity: IdentitySnapshot;
  cohortId: string;
}

type InternalEvent =
  | FillCompleteEvent
  | FillFailureEvent
  | LeaseRecoveryEvent
  | LateFillEvent;

interface ScheduledManifestEvent {
  kind: 'manifest';
  at: number;
  order: number;
  event: ManifestEvent;
}

type ScheduledEvent = ScheduledManifestEvent | InternalEvent;

interface OutcomeCounters {
  requests: number;
  freshHits: number;
  staleWhileRevalidateHits: number;
  staleIfErrorHits: number;
  unsafeHits: number;
  semanticFalseHits: number;
  unsafePrevented: number;
  originResponses: number;
  coalescedWaiters: number;
  errors: number;
  blocked: number;
  latencyMs: number[];
}

interface CohortStats {
  originCalls: number;
  originSuccesses: number;
  originFailures: number;
}

interface RawMetrics {
  requests: number;
  bytesDemanded: number;
  baselineComputeUnits: number;
  rawHitRequests: number;
  safeHitRequests: number;
  rawCacheBytes: number;
  safeCacheBytes: number;
  originCalls: number;
  originSuccesses: number;
  originFailures: number;
  actualOriginComputeUnits: number;
  freshHits: number;
  staleWhileRevalidateHits: number;
  staleIfErrorHits: number;
  unsafeHits: number;
  semanticFalseHits: number;
  unsafePrevented: number;
  coalescedWaiters: number;
  evictions: number;
  admissionRejects: number;
  expirations: number;
  invalidations: number;
  fencedWritesRejected: number;
  staleFillRejected: number;
  errors: number;
  blocked: number;
  latencyMs: number[];
}

export interface PublicMetrics {
  requests: number;
  requestHitRate: number;
  safeRequestHitRate: number;
  byteHitRate: number;
  safeByteHitRate: number;
  computeSavedRatio: number;
  originCalls: number;
  originSuccesses: number;
  originFailures: number;
  fillAmplification: number;
  staleHits: {
    staleWhileRevalidate: number;
    staleIfError: number;
  };
  unsafeHits: number;
  semanticFalseHits: number;
  unsafePrevented: number;
  evictions: number;
  admissionRejects: number;
  expirations: number;
  coalescedWaiters: number;
  fencedWritesRejected: number;
  staleFillRejected: number;
  errors: number;
  blocked: number;
  latencyMs: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface SimulationResult {
  configId: string;
  configDescription: string;
  metrics: PublicMetrics;
  requestOutcomes: Record<string, OutcomeCounters>;
  cohortStats: Record<string, CohortStats>;
  cacheInventory: Array<{
    key: string;
    sourceResourceId: string;
    answerId: string;
    sizeBytes: number;
    generation: number;
    permissionRevision: number;
    fence: number;
  }>;
}

export interface AssertionResult {
  id: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export interface LabReport {
  schemaVersion: 'cache-lab-report/v1';
  generatedBy: 'deterministic-cache-lab.ts';
  manifestDescription: string;
  metricDefinitions: Record<string, string>;
  results: SimulationResult[];
  assertions: AssertionResult[];
}

function assertManifest(value: unknown): asserts value is Manifest {
  if (!value || typeof value !== 'object') {
    throw new Error('Manifest must be an object.');
  }
  const manifest = value as Partial<Manifest>;
  if (manifest.schemaVersion !== 'cache-lab-manifest/v1') {
    throw new Error(`Unsupported schemaVersion: ${String(manifest.schemaVersion)}`);
  }
  if (!Array.isArray(manifest.resources) || manifest.resources.length === 0) {
    throw new Error('Manifest.resources must be a non-empty array.');
  }
  if (!Array.isArray(manifest.configs) || manifest.configs.length === 0) {
    throw new Error('Manifest.configs must be a non-empty array.');
  }
  if (!Array.isArray(manifest.events) || manifest.events.length === 0) {
    throw new Error('Manifest.events must be a non-empty array.');
  }

  const resourceIds = new Set<string>();
  for (const resource of manifest.resources) {
    if (resourceIds.has(resource.id)) {
      throw new Error(`Duplicate resource id: ${resource.id}`);
    }
    resourceIds.add(resource.id);
    for (const field of ['bytes', 'computeUnits', 'originLatencyMs'] as const) {
      if (!Number.isFinite(resource[field]) || resource[field] < 0) {
        throw new Error(`Resource ${resource.id} has invalid ${field}.`);
      }
    }
  }

  const configIds = new Set<string>();
  for (const config of manifest.configs) {
    if (configIds.has(config.id)) {
      throw new Error(`Duplicate config id: ${config.id}`);
    }
    configIds.add(config.id);
    if (!['none', 'lru', 'frequency-admission'].includes(config.policy)) {
      throw new Error(`Config ${config.id} has unsupported policy ${config.policy}.`);
    }
  }

  for (const event of manifest.events) {
    if (!Number.isFinite(event.at) || event.at < 0) {
      throw new Error(`Event has invalid time: ${JSON.stringify(event)}`);
    }
    if ('resourceId' in event && !resourceIds.has(event.resourceId)) {
      throw new Error(`Event references unknown resource: ${event.resourceId}`);
    }
    if (event.kind === 'request' && (!Number.isInteger(event.count) || event.count <= 0)) {
      throw new Error(`Request ${event.id} has invalid count.`);
    }
  }
}

function cloneResource(resource: ResourceState): ResourceState {
  return { ...resource };
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function entryIntegrityHash(entry: Omit<CacheEntry, 'integrityHash'>): string {
  return stableHash(
    [
      entry.sourceResourceId,
      entry.answerId,
      String(entry.exists),
      String(entry.sizeBytes),
      String(entry.computeUnits),
      entry.tenantId,
      entry.principalScope,
      String(entry.generation),
      String(entry.permissionRevision),
      entry.modelRevision,
      entry.tokenizerRevision,
      entry.adapterRevision,
      entry.multimodalHash,
      entry.cacheSalt,
      String(entry.fence),
    ].join('|'),
  );
}

function makeIdentity(
  resource: ResourceState,
  tenantId: string,
  principalScope: string,
): IdentitySnapshot {
  return {
    tenantId,
    principalScope,
    generation: resource.generation,
    permissionRevision: resource.permissionRevision,
    modelRevision: resource.modelRevision,
    tokenizerRevision: resource.tokenizerRevision,
    adapterRevision: resource.adapterRevision,
    multimodalHash: resource.multimodalHash,
    cacheSalt: resource.cacheSalt,
  };
}

function cacheKey(
  config: CacheConfig,
  resource: ResourceState,
  event: Pick<RequestEvent, 'resourceId' | 'semanticGroup' | 'tenantId' | 'principalScope'>,
): string {
  const base =
    config.semanticMode === 'unsafe' && event.semanticGroup
      ? `semantic:${event.semanticGroup}`
      : `resource:${event.resourceId}`;

  const parts = [base, `tenant=${event.tenantId}`, `scope=${event.principalScope}`];
  if (config.completeIdentity) {
    parts.push(
      `generation=${resource.generation}`,
      `permission=${resource.permissionRevision}`,
      `model=${resource.modelRevision}`,
      `tokenizer=${resource.tokenizerRevision}`,
      `adapter=${resource.adapterRevision}`,
      `multimodal=${resource.multimodalHash}`,
      `salt=${resource.cacheSalt}`,
    );
  }
  return parts.join('|');
}

function identityMatches(
  entry: CacheEntry,
  requestResource: ResourceState,
  event: RequestEvent,
): boolean {
  return (
    entry.tenantId === event.tenantId &&
    entry.principalScope === event.principalScope &&
    entry.generation === requestResource.generation &&
    entry.permissionRevision === requestResource.permissionRevision &&
    entry.modelRevision === requestResource.modelRevision &&
    entry.tokenizerRevision === requestResource.tokenizerRevision &&
    entry.adapterRevision === requestResource.adapterRevision &&
    entry.multimodalHash === requestResource.multimodalHash &&
    entry.cacheSalt === requestResource.cacheSalt
  );
}

function payloadIntegrityValid(entry: CacheEntry): boolean {
  const { integrityHash: _ignored, ...rest } = entry;
  return entry.integrityHash === entryIntegrityHash(rest);
}

function percentile(values: number[], percentileValue: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil(percentileValue * sorted.length));
  return sorted[Math.min(sorted.length - 1, rank - 1)];
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(6));
}

function emptyOutcome(): OutcomeCounters {
  return {
    requests: 0,
    freshHits: 0,
    staleWhileRevalidateHits: 0,
    staleIfErrorHits: 0,
    unsafeHits: 0,
    semanticFalseHits: 0,
    unsafePrevented: 0,
    originResponses: 0,
    coalescedWaiters: 0,
    errors: 0,
    blocked: 0,
    latencyMs: [],
  };
}

function emptyMetrics(): RawMetrics {
  return {
    requests: 0,
    bytesDemanded: 0,
    baselineComputeUnits: 0,
    rawHitRequests: 0,
    safeHitRequests: 0,
    rawCacheBytes: 0,
    safeCacheBytes: 0,
    originCalls: 0,
    originSuccesses: 0,
    originFailures: 0,
    actualOriginComputeUnits: 0,
    freshHits: 0,
    staleWhileRevalidateHits: 0,
    staleIfErrorHits: 0,
    unsafeHits: 0,
    semanticFalseHits: 0,
    unsafePrevented: 0,
    coalescedWaiters: 0,
    evictions: 0,
    admissionRejects: 0,
    expirations: 0,
    invalidations: 0,
    fencedWritesRejected: 0,
    staleFillRejected: 0,
    errors: 0,
    blocked: 0,
    latencyMs: [],
  };
}

class CacheStore {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly frequencies = new Map<string, number>();
  private totalBytes = 0;

  private readonly config: CacheConfig;
  private readonly metrics: RawMetrics;

  constructor(config: CacheConfig, metrics: RawMetrics) {
    this.config = config;
    this.metrics = metrics;
  }

  recordRequest(key: string, count: number): void {
    this.frequencies.set(key, (this.frequencies.get(key) ?? 0) + count);
  }

  get(key: string, now: number): CacheEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    entry.lastAccessAt = now;
    return entry;
  }

  remove(key: string): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.totalBytes -= entry.sizeBytes;
    this.entries.delete(key);
  }

  purgeExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (now > entry.staleUntil) {
        this.remove(key);
        this.metrics.expirations += 1;
      }
    }
  }

  forcePut(entry: CacheEntry): void {
    if (this.config.policy === 'none' || this.config.capacityBytes <= 0) return;
    const existing = this.entries.get(entry.key);
    if (existing) {
      this.totalBytes -= existing.sizeBytes;
    }
    while (this.totalBytes + entry.sizeBytes > this.config.capacityBytes && this.entries.size > 0) {
      this.evictLru();
    }
    if (entry.sizeBytes <= this.config.capacityBytes) {
      this.entries.set(entry.key, entry);
      this.totalBytes += entry.sizeBytes;
    }
  }

  put(entry: CacheEntry): boolean {
    if (this.config.policy === 'none' || this.config.capacityBytes <= 0) return false;
    if (entry.sizeBytes > this.config.capacityBytes) {
      this.metrics.admissionRejects += 1;
      return false;
    }

    const existing = this.entries.get(entry.key);
    if (existing) {
      this.totalBytes -= existing.sizeBytes;
      this.entries.delete(entry.key);
    }

    if (this.totalBytes + entry.sizeBytes <= this.config.capacityBytes) {
      this.entries.set(entry.key, entry);
      this.totalBytes += entry.sizeBytes;
      return true;
    }

    if (this.config.policy === 'frequency-admission') {
      const victim = this.lruVictim();
      if (victim) {
        const candidateFrequency = this.frequencies.get(entry.key) ?? 0;
        const victimFrequency = this.frequencies.get(victim.key) ?? 0;
        if (candidateFrequency <= victimFrequency) {
          this.metrics.admissionRejects += 1;
          return false;
        }
      }
    }

    while (this.totalBytes + entry.sizeBytes > this.config.capacityBytes && this.entries.size > 0) {
      this.evictLru();
    }
    this.entries.set(entry.key, entry);
    this.totalBytes += entry.sizeBytes;
    return true;
  }

  inventory(): CacheEntry[] {
    return [...this.entries.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  private lruVictim(): CacheEntry | undefined {
    let victim: CacheEntry | undefined;
    for (const entry of this.entries.values()) {
      if (
        !victim ||
        entry.lastAccessAt < victim.lastAccessAt ||
        (entry.lastAccessAt === victim.lastAccessAt && entry.key < victim.key)
      ) {
        victim = entry;
      }
    }
    return victim;
  }

  private evictLru(): void {
    const victim = this.lruVictim();
    if (!victim) return;
    this.remove(victim.key);
    this.metrics.evictions += 1;
  }
}

class Simulator {
  private readonly resources = new Map<string, ResourceState>();
  private readonly metrics = emptyMetrics();
  private readonly outcomes = new Map<string, OutcomeCounters>();
  private readonly cohortStats = new Map<string, CohortStats>();
  private readonly originCohorts = new Set<string>();
  private readonly inFlight = new Map<string, InFlight>();
  private readonly latestFence = new Map<string, number>();
  private readonly crashNextFill = new Set<string>();
  private readonly cache: CacheStore;
  private readonly queue: ScheduledEvent[] = [];
  private nextOrder = 1_000_000;
  private outage = false;

  private readonly manifest: Manifest;
  private readonly config: CacheConfig;

  constructor(manifest: Manifest, config: CacheConfig) {
    this.manifest = manifest;
    this.config = config;
    for (const resource of manifest.resources) {
      this.resources.set(resource.id, cloneResource(resource));
    }
    this.cache = new CacheStore(config, this.metrics);
    manifest.events.forEach((event, index) => {
      this.queue.push({
        kind: 'manifest',
        at: event.at,
        order: index,
        event,
      });
    });
  }

  run(): SimulationResult {
    while (this.queue.length > 0) {
      this.queue.sort((a, b) => a.at - b.at || eventPriority(a) - eventPriority(b) || a.order - b.order);
      const event = this.queue.shift();
      if (!event) break;
      this.cache.purgeExpired(event.at);
      this.process(event);
    }

    const cohortRecord: Record<string, CohortStats> = {};
    for (const [id, value] of [...this.cohortStats.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      cohortRecord[id] = value;
    }
    const outcomeRecord: Record<string, OutcomeCounters> = {};
    for (const [id, value] of [...this.outcomes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      outcomeRecord[id] = value;
    }

    const computeSaved =
      this.metrics.baselineComputeUnits === 0
        ? 0
        : (this.metrics.baselineComputeUnits - this.metrics.actualOriginComputeUnits) /
          this.metrics.baselineComputeUnits;

    const publicMetrics: PublicMetrics = {
      requests: this.metrics.requests,
      requestHitRate: ratio(this.metrics.rawHitRequests, this.metrics.requests),
      safeRequestHitRate: ratio(this.metrics.safeHitRequests, this.metrics.requests),
      byteHitRate: ratio(this.metrics.rawCacheBytes, this.metrics.bytesDemanded),
      safeByteHitRate: ratio(this.metrics.safeCacheBytes, this.metrics.bytesDemanded),
      computeSavedRatio: Number(computeSaved.toFixed(6)),
      originCalls: this.metrics.originCalls,
      originSuccesses: this.metrics.originSuccesses,
      originFailures: this.metrics.originFailures,
      fillAmplification: ratio(this.metrics.originCalls, this.originCohorts.size),
      staleHits: {
        staleWhileRevalidate: this.metrics.staleWhileRevalidateHits,
        staleIfError: this.metrics.staleIfErrorHits,
      },
      unsafeHits: this.metrics.unsafeHits,
      semanticFalseHits: this.metrics.semanticFalseHits,
      unsafePrevented: this.metrics.unsafePrevented,
      evictions: this.metrics.evictions,
      admissionRejects: this.metrics.admissionRejects,
      expirations: this.metrics.expirations,
      coalescedWaiters: this.metrics.coalescedWaiters,
      fencedWritesRejected: this.metrics.fencedWritesRejected,
      staleFillRejected: this.metrics.staleFillRejected,
      errors: this.metrics.errors,
      blocked: this.metrics.blocked,
      latencyMs: {
        p50: percentile(this.metrics.latencyMs, 0.5),
        p95: percentile(this.metrics.latencyMs, 0.95),
        p99: percentile(this.metrics.latencyMs, 0.99),
      },
    };

    return {
      configId: this.config.id,
      configDescription: this.config.description,
      metrics: publicMetrics,
      requestOutcomes: outcomeRecord,
      cohortStats: cohortRecord,
      cacheInventory: this.cache.inventory().map((entry) => ({
        key: entry.key,
        sourceResourceId: entry.sourceResourceId,
        answerId: entry.answerId,
        sizeBytes: entry.sizeBytes,
        generation: entry.generation,
        permissionRevision: entry.permissionRevision,
        fence: entry.fence,
      })),
    };
  }

  private process(event: ScheduledEvent): void {
    switch (event.kind) {
      case 'manifest':
        this.processManifestEvent(event.event);
        break;
      case 'fill-complete':
        this.processFillComplete(event);
        break;
      case 'fill-failure':
        this.processFillFailure(event);
        break;
      case 'lease-recovery':
        this.processLeaseRecovery(event);
        break;
      case 'late-fill':
        this.processLateFill(event);
        break;
      default:
        exhaustive(event);
    }
  }

  private processManifestEvent(event: ManifestEvent): void {
    switch (event.kind) {
      case 'request':
        this.processRequest(event);
        break;
      case 'mutate': {
        const resource = this.resource(event.resourceId);
        Object.assign(resource, event.patch);
        break;
      }
      case 'outage-start':
        this.outage = true;
        break;
      case 'outage-end':
        this.outage = false;
        break;
      case 'crash-next-fill':
        this.crashNextFill.add(event.resourceId);
        break;
      case 'poison':
        this.injectPoison(event);
        break;
      default:
        exhaustive(event);
    }
  }

  private processRequest(event: RequestEvent): void {
    const resource = cloneResource(this.resource(event.resourceId));
    const outcome = this.outcome(event.id);
    outcome.requests += event.count;
    this.metrics.requests += event.count;
    this.metrics.bytesDemanded += resource.bytes * event.count;
    this.metrics.baselineComputeUnits += resource.computeUnits * event.count;

    const key = cacheKey(this.config, resource, event);
    this.cache.recordRequest(key, event.count);
    const cached = this.cache.get(key, event.at);

    if (cached) {
      const validIdentity = identityMatches(cached, resource, event);
      const validPayload = payloadIntegrityValid(cached);
      const semanticFalse =
        this.config.semanticMode === 'unsafe' && cached.answerId !== resource.answerId;
      const shouldReject =
        (!validIdentity && this.config.validateOnRead) ||
        (!validPayload && this.config.validatePayload);

      if (shouldReject) {
        this.metrics.unsafePrevented += event.count;
        outcome.unsafePrevented += event.count;
        this.cache.remove(key);
      } else if (!validIdentity || !validPayload || semanticFalse) {
        this.recordUnsafeHit(event, resource, outcome, semanticFalse);
        return;
      } else if (event.at <= cached.freshUntil) {
        this.recordFreshHit(event, resource, outcome);
        return;
      } else if (event.at <= cached.staleUntil) {
        if (!this.outage && this.config.staleWhileRevalidateMs > 0) {
          this.recordStaleHit(event, resource, outcome, 'swr');
          this.ensureBackgroundRefresh(event, resource, key);
          return;
        }
        if (this.outage && this.config.staleIfErrorMs > 0) {
          this.recordStaleIfError(event, resource, outcome);
          return;
        }
      } else {
        this.cache.remove(key);
        this.metrics.expirations += 1;
      }
    }

    this.startOrJoinFill(event, resource, key);
  }

  private startOrJoinFill(event: RequestEvent, resource: ResourceState, key: string): void {
    const waiter: RequestWaiter = {
      event,
      requestResource: resource,
      key,
    };

    if (this.config.singleflight) {
      const existing = this.inFlight.get(key);
      if (existing) {
        existing.waiters.push(waiter);
        this.metrics.coalescedWaiters += event.count;
        this.outcome(event.id).coalescedWaiters += event.count;
        return;
      }

      const coalesced = Math.max(0, event.count - 1);
      this.metrics.coalescedWaiters += coalesced;
      this.outcome(event.id).coalescedWaiters += coalesced;
      const fence = (this.latestFence.get(key) ?? 0) + 1;
      this.latestFence.set(key, fence);
      const inFlight: InFlight = {
        key,
        fence,
        waiters: [waiter],
        sourceSnapshot: resource,
        identity: makeIdentity(resource, event.tenantId, event.principalScope),
        cohortId: event.cohortId,
        startedAt: event.at,
        background: false,
        recovering: false,
      };
      this.inFlight.set(key, inFlight);
      this.startSingleflightAttempt(inFlight, event.at);
      return;
    }

    const callCount = event.count;
    this.recordOriginStart(event.cohortId, callCount, resource.computeUnits);
    if (this.outage) {
      this.schedule({
        kind: 'fill-failure',
        at: event.at + this.manifest.originFailureLatencyMs,
        order: this.next(),
        key,
        fence: 0,
        callCount,
        waiters: [waiter],
        cohortId: event.cohortId,
      });
    } else {
      this.schedule({
        kind: 'fill-complete',
        at: event.at + resource.originLatencyMs,
        order: this.next(),
        key,
        fence: 0,
        callCount,
        sourceSnapshot: resource,
        identity: makeIdentity(resource, event.tenantId, event.principalScope),
        waiters: [waiter],
        cohortId: event.cohortId,
        background: false,
      });
    }
  }

  private startSingleflightAttempt(inFlight: InFlight, now: number): void {
    this.recordOriginStart(inFlight.cohortId, 1, inFlight.sourceSnapshot.computeUnits);

    const shouldCrash =
      this.config.leaseFencing && this.crashNextFill.has(inFlight.sourceSnapshot.id) && !inFlight.recovering;
    if (shouldCrash) {
      this.crashNextFill.delete(inFlight.sourceSnapshot.id);
      this.schedule({
        kind: 'lease-recovery',
        at: now + this.manifest.leaseMs,
        order: this.next(),
        key: inFlight.key,
        fence: inFlight.fence,
      });
      this.schedule({
        kind: 'late-fill',
        at: now + this.manifest.leaseMs + inFlight.sourceSnapshot.originLatencyMs * 4,
        order: this.next(),
        key: inFlight.key,
        fence: inFlight.fence,
        sourceSnapshot: inFlight.sourceSnapshot,
        identity: inFlight.identity,
        cohortId: inFlight.cohortId,
      });
      return;
    }

    if (this.outage) {
      this.schedule({
        kind: 'fill-failure',
        at: now + this.manifest.originFailureLatencyMs,
        order: this.next(),
        key: inFlight.key,
        fence: inFlight.fence,
        callCount: 1,
        waiters: inFlight.waiters,
        cohortId: inFlight.cohortId,
        singleflightKey: inFlight.key,
      });
      return;
    }

    this.schedule({
      kind: 'fill-complete',
      at: now + inFlight.sourceSnapshot.originLatencyMs,
      order: this.next(),
      key: inFlight.key,
      fence: inFlight.fence,
      callCount: 1,
      sourceSnapshot: inFlight.sourceSnapshot,
      identity: inFlight.identity,
      waiters: inFlight.waiters,
      cohortId: inFlight.cohortId,
      background: inFlight.background,
      singleflightKey: inFlight.key,
    });
  }

  private ensureBackgroundRefresh(event: RequestEvent, resource: ResourceState, key: string): void {
    if (this.inFlight.has(key)) return;
    const fence = (this.latestFence.get(key) ?? 0) + 1;
    this.latestFence.set(key, fence);
    const inFlight: InFlight = {
      key,
      fence,
      waiters: [],
      sourceSnapshot: resource,
      identity: makeIdentity(resource, event.tenantId, event.principalScope),
      cohortId: `${event.cohortId}:swr-refresh`,
      startedAt: event.at,
      background: true,
      recovering: false,
    };
    this.inFlight.set(key, inFlight);
    this.startSingleflightAttempt(inFlight, event.at);
  }

  private processFillComplete(event: FillCompleteEvent): void {
    this.metrics.originSuccesses += event.callCount;
    this.cohort(event.cohortId).originSuccesses += event.callCount;

    if (event.fence > 0 && event.fence < (this.latestFence.get(event.key) ?? 0)) {
      this.metrics.fencedWritesRejected += 1;
      return;
    }

    const currentResource = this.resource(event.sourceSnapshot.id);
    const sourceStillCurrent = this.sourceSnapshotStillCurrent(event.sourceSnapshot, currentResource);
    if (!sourceStillCurrent && this.config.validateOnRead) {
      this.metrics.staleFillRejected += 1;
      for (const waiter of event.waiters) {
        this.recordBlocked(waiter, event.at);
      }
      if (event.singleflightKey) this.inFlight.delete(event.singleflightKey);
      return;
    }

    const entryWithoutHash: Omit<CacheEntry, 'integrityHash'> = {
      key: event.key,
      sourceResourceId: event.sourceSnapshot.id,
      answerId: event.sourceSnapshot.answerId,
      exists: event.sourceSnapshot.exists,
      sizeBytes: event.sourceSnapshot.bytes,
      computeUnits: event.sourceSnapshot.computeUnits,
      createdAt: event.at,
      freshUntil: event.at + this.config.ttlMs,
      staleUntil:
        event.at +
        this.config.ttlMs +
        Math.max(this.config.staleWhileRevalidateMs, this.config.staleIfErrorMs),
      lastAccessAt: event.at,
      fence: event.fence,
      ...event.identity,
    };
    const entry: CacheEntry = {
      ...entryWithoutHash,
      integrityHash: entryIntegrityHash(entryWithoutHash),
    };
    this.cache.put(entry);

    for (const waiter of event.waiters) {
      this.resolveOriginWaiter(waiter, entry, event.at);
    }
    if (event.singleflightKey) this.inFlight.delete(event.singleflightKey);
  }

  private processFillFailure(event: FillFailureEvent): void {
    this.metrics.originFailures += event.callCount;
    this.cohort(event.cohortId).originFailures += event.callCount;
    for (const waiter of event.waiters) {
      const outcome = this.outcome(waiter.event.id);
      outcome.errors += waiter.event.count;
      this.metrics.errors += waiter.event.count;
      this.recordLatency(waiter.event, outcome, event.at - waiter.event.at + this.manifest.lookupLatencyMs);
    }
    if (event.singleflightKey) this.inFlight.delete(event.singleflightKey);
  }

  private processLeaseRecovery(event: LeaseRecoveryEvent): void {
    const inFlight = this.inFlight.get(event.key);
    if (!inFlight || inFlight.fence !== event.fence) return;
    const nextFence = (this.latestFence.get(event.key) ?? event.fence) + 1;
    this.latestFence.set(event.key, nextFence);
    inFlight.fence = nextFence;
    inFlight.recovering = true;
    inFlight.sourceSnapshot = cloneResource(this.resource(inFlight.sourceSnapshot.id));
    inFlight.identity = {
      ...inFlight.identity,
      generation: inFlight.sourceSnapshot.generation,
      permissionRevision: inFlight.sourceSnapshot.permissionRevision,
      modelRevision: inFlight.sourceSnapshot.modelRevision,
      tokenizerRevision: inFlight.sourceSnapshot.tokenizerRevision,
      adapterRevision: inFlight.sourceSnapshot.adapterRevision,
      multimodalHash: inFlight.sourceSnapshot.multimodalHash,
      cacheSalt: inFlight.sourceSnapshot.cacheSalt,
    };
    this.startSingleflightAttempt(inFlight, event.at);
  }

  private processLateFill(event: LateFillEvent): void {
    this.metrics.originSuccesses += 1;
    this.cohort(event.cohortId).originSuccesses += 1;
    if (event.fence < (this.latestFence.get(event.key) ?? 0)) {
      this.metrics.fencedWritesRejected += 1;
      return;
    }
    throw new Error('Late fill unexpectedly retained the latest fence.');
  }

  private resolveOriginWaiter(waiter: RequestWaiter, entry: CacheEntry, completedAt: number): void {
    const current = this.resource(waiter.event.resourceId);
    const permissionStillValid =
      current.permissionRevision === waiter.requestResource.permissionRevision &&
      current.generation === waiter.requestResource.generation;
    if (!permissionStillValid && this.config.validateOnRead) {
      this.recordBlocked(waiter, completedAt);
      return;
    }

    const outcome = this.outcome(waiter.event.id);
    outcome.originResponses += waiter.event.count;
    this.recordLatency(
      waiter.event,
      outcome,
      completedAt - waiter.event.at + this.manifest.lookupLatencyMs,
    );

    if (
      this.config.semanticMode === 'unsafe' &&
      entry.answerId !== waiter.requestResource.answerId
    ) {
      outcome.semanticFalseHits += waiter.event.count;
      outcome.unsafeHits += waiter.event.count;
      this.metrics.semanticFalseHits += waiter.event.count;
      this.metrics.unsafeHits += waiter.event.count;
    }
  }

  private recordFreshHit(
    event: RequestEvent,
    resource: ResourceState,
    outcome: OutcomeCounters,
  ): void {
    outcome.freshHits += event.count;
    this.metrics.freshHits += event.count;
    this.metrics.rawHitRequests += event.count;
    this.metrics.safeHitRequests += event.count;
    this.metrics.rawCacheBytes += resource.bytes * event.count;
    this.metrics.safeCacheBytes += resource.bytes * event.count;
    this.recordLatency(event, outcome, this.manifest.lookupLatencyMs);
  }

  private recordStaleHit(
    event: RequestEvent,
    resource: ResourceState,
    outcome: OutcomeCounters,
    kind: 'swr',
  ): void {
    if (kind !== 'swr') exhaustive(kind);
    outcome.staleWhileRevalidateHits += event.count;
    this.metrics.staleWhileRevalidateHits += event.count;
    this.metrics.rawHitRequests += event.count;
    this.metrics.safeHitRequests += event.count;
    this.metrics.rawCacheBytes += resource.bytes * event.count;
    this.metrics.safeCacheBytes += resource.bytes * event.count;
    this.recordLatency(event, outcome, this.manifest.lookupLatencyMs);
  }

  private recordStaleIfError(
    event: RequestEvent,
    resource: ResourceState,
    outcome: OutcomeCounters,
  ): void {
    const calls = this.config.singleflight ? 1 : event.count;
    this.recordOriginStart(event.cohortId, calls, resource.computeUnits);
    this.metrics.originFailures += calls;
    this.cohort(event.cohortId).originFailures += calls;
    outcome.staleIfErrorHits += event.count;
    this.metrics.staleIfErrorHits += event.count;
    this.metrics.rawHitRequests += event.count;
    this.metrics.safeHitRequests += event.count;
    this.metrics.rawCacheBytes += resource.bytes * event.count;
    this.metrics.safeCacheBytes += resource.bytes * event.count;
    this.recordLatency(
      event,
      outcome,
      this.manifest.lookupLatencyMs + this.manifest.originFailureLatencyMs,
    );
  }

  private recordUnsafeHit(
    event: RequestEvent,
    resource: ResourceState,
    outcome: OutcomeCounters,
    semanticFalse: boolean,
  ): void {
    outcome.unsafeHits += event.count;
    this.metrics.unsafeHits += event.count;
    this.metrics.rawHitRequests += event.count;
    this.metrics.rawCacheBytes += resource.bytes * event.count;
    if (semanticFalse) {
      outcome.semanticFalseHits += event.count;
      this.metrics.semanticFalseHits += event.count;
    }
    this.recordLatency(event, outcome, this.manifest.lookupLatencyMs);
  }

  private recordBlocked(waiter: RequestWaiter, at: number): void {
    const outcome = this.outcome(waiter.event.id);
    outcome.blocked += waiter.event.count;
    this.metrics.blocked += waiter.event.count;
    this.recordLatency(
      waiter.event,
      outcome,
      at - waiter.event.at + this.manifest.lookupLatencyMs,
    );
  }

  private recordLatency(event: RequestEvent, outcome: OutcomeCounters, latencyMs: number): void {
    for (let i = 0; i < event.count; i += 1) {
      outcome.latencyMs.push(latencyMs);
      this.metrics.latencyMs.push(latencyMs);
    }
  }

  private recordOriginStart(cohortId: string, calls: number, computeUnits: number): void {
    this.originCohorts.add(cohortId);
    this.metrics.originCalls += calls;
    this.metrics.actualOriginComputeUnits += calls * computeUnits;
    this.cohort(cohortId).originCalls += calls;
  }

  private sourceSnapshotStillCurrent(snapshot: ResourceState, current: ResourceState): boolean {
    return (
      snapshot.generation === current.generation &&
      snapshot.permissionRevision === current.permissionRevision &&
      snapshot.modelRevision === current.modelRevision &&
      snapshot.tokenizerRevision === current.tokenizerRevision &&
      snapshot.adapterRevision === current.adapterRevision &&
      snapshot.multimodalHash === current.multimodalHash &&
      snapshot.cacheSalt === current.cacheSalt &&
      snapshot.answerId === current.answerId &&
      snapshot.exists === current.exists
    );
  }

  private injectPoison(event: PoisonEvent): void {
    if (this.config.policy === 'none') return;
    const resource = cloneResource(this.resource(event.resourceId));
    const requestShape: RequestEvent = {
      kind: 'request',
      at: event.at,
      id: 'poison-injection',
      cohortId: 'poison-injection',
      resourceId: event.resourceId,
      count: 1,
      tenantId: event.tenantId,
      principalScope: event.principalScope,
    };
    const key = cacheKey(this.config, resource, requestShape);
    const entry: CacheEntry = {
      key,
      sourceResourceId: resource.id,
      answerId: 'attacker-controlled-value',
      exists: true,
      sizeBytes: resource.bytes,
      computeUnits: resource.computeUnits,
      createdAt: event.at,
      freshUntil: event.at + Math.max(1, this.config.ttlMs),
      staleUntil:
        event.at +
        Math.max(1, this.config.ttlMs) +
        Math.max(this.config.staleWhileRevalidateMs, this.config.staleIfErrorMs),
      lastAccessAt: event.at,
      integrityHash: 'invalid-integrity-hash',
      fence: this.latestFence.get(key) ?? 0,
      ...makeIdentity(resource, event.tenantId, event.principalScope),
    };
    this.cache.forcePut(entry);
  }

  private resource(id: string): ResourceState {
    const resource = this.resources.get(id);
    if (!resource) throw new Error(`Unknown resource: ${id}`);
    return resource;
  }

  private outcome(id: string): OutcomeCounters {
    const existing = this.outcomes.get(id);
    if (existing) return existing;
    const created = emptyOutcome();
    this.outcomes.set(id, created);
    return created;
  }

  private cohort(id: string): CohortStats {
    const existing = this.cohortStats.get(id);
    if (existing) return existing;
    const created: CohortStats = {
      originCalls: 0,
      originSuccesses: 0,
      originFailures: 0,
    };
    this.cohortStats.set(id, created);
    return created;
  }

  private schedule(event: InternalEvent): void {
    this.queue.push(event);
  }

  private next(): number {
    const value = this.nextOrder;
    this.nextOrder += 1;
    return value;
  }
}

function eventPriority(event: ScheduledEvent): number {
  if (event.kind === 'manifest') {
    switch (event.event.kind) {
      case 'mutate':
      case 'outage-start':
      case 'outage-end':
      case 'crash-next-fill':
      case 'poison':
        return 0;
      case 'request':
        return 3;
      default:
        return exhaustive(event.event);
    }
  }
  switch (event.kind) {
    case 'lease-recovery':
      return 1;
    case 'fill-complete':
    case 'fill-failure':
    case 'late-fill':
      return 2;
    default:
      return exhaustive(event);
  }
}

function exhaustive(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}

export function readManifest(filePath: string): Manifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Unable to read manifest ${filePath}: ${String(error)}`);
  }
  assertManifest(parsed);
  return parsed;
}

function findResult(results: SimulationResult[], configId: string): SimulationResult {
  const result = results.find((candidate) => candidate.configId === configId);
  if (!result) throw new Error(`Missing result for config ${configId}`);
  return result;
}

function outcome(result: SimulationResult, requestId: string): OutcomeCounters {
  const value = result.requestOutcomes[requestId];
  if (!value) throw new Error(`Missing outcome ${requestId} for ${result.configId}`);
  return value;
}

function cohort(result: SimulationResult, cohortId: string): CohortStats {
  const value = result.cohortStats[cohortId];
  if (!value) throw new Error(`Missing cohort ${cohortId} for ${result.configId}`);
  return value;
}

function addAssertion(
  assertions: AssertionResult[],
  id: string,
  condition: boolean,
  expected: string,
  actual: Primitive,
): void {
  assertions.push({
    id,
    passed: condition,
    expected,
    actual: String(actual),
  });
}

function buildAssertions(results: SimulationResult[]): AssertionResult[] {
  const assertions: AssertionResult[] = [];
  const noCache = findResult(results, 'no-cache');
  const naive = findResult(results, 'lru-naive');
  const lruTtl = findResult(results, 'lru-ttl');
  const lruSafe = findResult(results, 'lru-singleflight-safe');
  const frequency = findResult(results, 'frequency-admission-safe');
  const semantic = findResult(results, 'semantic-negative-control');

  addAssertion(
    assertions,
    'burst-singleflight-one-fill',
    cohort(lruSafe, 'burst-100').originCalls === 1,
    '100 个并发 Miss 只启动 1 次 Origin Fill',
    cohort(lruSafe, 'burst-100').originCalls,
  );
  addAssertion(
    assertions,
    'burst-without-singleflight-amplifies',
    cohort(lruTtl, 'burst-100').originCalls === 100,
    '无 Singleflight 时合成工作负载启动 100 次 Origin Fill',
    cohort(lruTtl, 'burst-100').originCalls,
  );
  addAssertion(
    assertions,
    'no-cache-burst-is-baseline',
    cohort(noCache, 'burst-100').originCalls === 100,
    '无缓存基线对 100 个请求调用 Origin 100 次',
    cohort(noCache, 'burst-100').originCalls,
  );

  const safeGeneration = outcome(lruSafe, 'generation-after-switch');
  addAssertion(
    assertions,
    'generation-switch-safe-miss',
    safeGeneration.freshHits === 0 && safeGeneration.originResponses === 1 && safeGeneration.unsafeHits === 0,
    'Generation 切换后旧项不命中，回源 1 次且 unsafeHits=0',
    JSON.stringify(safeGeneration),
  );
  addAssertion(
    assertions,
    'generation-switch-naive-unsafe-hit',
    outcome(naive, 'generation-after-switch').unsafeHits === 1,
    '缺少 Generation 身份的负对照产生 1 次 unsafe hit',
    outcome(naive, 'generation-after-switch').unsafeHits,
  );

  const safePermission = outcome(lruSafe, 'permission-after-tighten');
  addAssertion(
    assertions,
    'permission-tighten-safe-miss',
    safePermission.freshHits === 0 && safePermission.originResponses === 1 && safePermission.unsafeHits === 0,
    'Permission Revision 变化后旧缓存不被服务',
    JSON.stringify(safePermission),
  );
  addAssertion(
    assertions,
    'permission-tighten-naive-unsafe-hit',
    outcome(naive, 'permission-after-tighten').unsafeHits === 1,
    '缺少 Permission Revision 的负对照产生 1 次 unsafe hit',
    outcome(naive, 'permission-after-tighten').unsafeHits,
  );

  const lruPostScanHits =
    outcome(lruSafe, 'hot-a-after-scan').freshHits +
    outcome(lruSafe, 'hot-b-after-scan').freshHits +
    outcome(lruSafe, 'hot-c-after-scan').freshHits;
  const frequencyPostScanHits =
    outcome(frequency, 'hot-a-after-scan').freshHits +
    outcome(frequency, 'hot-b-after-scan').freshHits +
    outcome(frequency, 'hot-c-after-scan').freshHits;
  addAssertion(
    assertions,
    'frequency-admission-resists-scan',
    frequencyPostScanHits > lruPostScanHits && frequencyPostScanHits === 3,
    '给定 Trace 中 Frequency Admission 保留 3 个热点，且优于 LRU',
    `frequency=${frequencyPostScanHits}, lru=${lruPostScanHits}`,
  );

  addAssertion(
    assertions,
    'fill-owner-crash-recovers-with-fence',
    cohort(lruSafe, 'fill-owner-crash').originCalls === 2 &&
      lruSafe.metrics.fencedWritesRejected >= 1 &&
      outcome(lruSafe, 'fill-owner-crash').originResponses === 20 &&
      outcome(lruSafe, 'fill-owner-crash').unsafeHits === 0,
    'Owner 崩溃后 2 次 Fill、旧 Fence 被拒绝、20 个等待者得到安全结果',
    `calls=${cohort(lruSafe, 'fill-owner-crash').originCalls}, fenced=${lruSafe.metrics.fencedWritesRejected}, outcome=${JSON.stringify(outcome(lruSafe, 'fill-owner-crash'))}`,
  );

  addAssertion(
    assertions,
    'stale-only-under-explicit-policy',
    outcome(lruSafe, 'swr-stale-request').staleWhileRevalidateHits === 1 &&
      outcome(lruSafe, 'sie-stale-on-error').staleIfErrorHits === 1 &&
      outcome(lruTtl, 'swr-stale-request').staleWhileRevalidateHits === 0 &&
      outcome(lruTtl, 'sie-stale-on-error').staleIfErrorHits === 0,
    '只有显式 SWR/SIE 配置服务 Stale；普通 TTL 配置不服务',
    `safeSWR=${outcome(lruSafe, 'swr-stale-request').staleWhileRevalidateHits}, safeSIE=${outcome(lruSafe, 'sie-stale-on-error').staleIfErrorHits}, ttlSWR=${outcome(lruTtl, 'swr-stale-request').staleWhileRevalidateHits}, ttlSIE=${outcome(lruTtl, 'sie-stale-on-error').staleIfErrorHits}`,
  );

  addAssertion(
    assertions,
    'prefix-identity-change-forces-miss',
    outcome(lruSafe, 'prefix-after-identity-change').originResponses === 1 &&
      outcome(lruSafe, 'prefix-after-identity-change').unsafeHits === 0,
    'Tokenizer/Adapter 变化后完整身份配置 Miss 并回源',
    JSON.stringify(outcome(lruSafe, 'prefix-after-identity-change')),
  );
  addAssertion(
    assertions,
    'prefix-naive-is-unsafe',
    outcome(naive, 'prefix-after-identity-change').unsafeHits === 1,
    '缺少模型身份的负对照产生 1 次 unsafe hit',
    outcome(naive, 'prefix-after-identity-change').unsafeHits,
  );

  addAssertion(
    assertions,
    'semantic-false-hit-counted-separately',
    outcome(semantic, 'semantic-hard-negative').semanticFalseHits === 1 &&
      semantic.metrics.semanticFalseHits >= 1,
    'Hard Negative 产生的错误命中进入 semanticFalseHits，而非普通安全命中',
    JSON.stringify(outcome(semantic, 'semantic-hard-negative')),
  );

  addAssertion(
    assertions,
    'negative-cache-invalidated-by-generation',
    outcome(lruSafe, 'negative-after-create').originResponses === 1 &&
      outcome(lruSafe, 'negative-after-create').unsafeHits === 0,
    '对象创建并切换 Generation 后不继续服务旧 Negative Cache',
    JSON.stringify(outcome(lruSafe, 'negative-after-create')),
  );
  addAssertion(
    assertions,
    'negative-cache-naive-stays-wrong',
    outcome(naive, 'negative-after-create').unsafeHits === 1,
    '缺少 Generation 的负对照继续服务旧 Negative Cache',
    outcome(naive, 'negative-after-create').unsafeHits,
  );

  addAssertion(
    assertions,
    'poison-is-rejected-by-integrity-check',
    outcome(lruSafe, 'poison-read').unsafePrevented === 1 &&
      outcome(lruSafe, 'poison-read').originResponses === 1 &&
      outcome(lruSafe, 'poison-read').unsafeHits === 0,
    '损坏/投毒条目被拒绝并回源，不作为命中服务',
    JSON.stringify(outcome(lruSafe, 'poison-read')),
  );
  addAssertion(
    assertions,
    'poison-naive-serves-unsafe-value',
    outcome(naive, 'poison-read').unsafeHits === 1,
    '无完整性验证的负对照服务 1 次 unsafe hit',
    outcome(naive, 'poison-read').unsafeHits,
  );

  return assertions;
}

export function buildReport(manifest: Manifest): LabReport {
  const results = manifest.configs.map((config) => new Simulator(manifest, config).run());
  return {
    schemaVersion: 'cache-lab-report/v1',
    generatedBy: 'deterministic-cache-lab.ts',
    manifestDescription: manifest.description,
    metricDefinitions: {
      requestHitRate:
        '所有由缓存条目直接服务的请求 / 总请求；包含显式允许的 Stale，也包含负对照中的 Unsafe Hit，因此必须与 safeRequestHitRate 和 unsafeHits 一起读。',
      safeRequestHitRate:
        'Fresh Hit 与策略明确允许、身份验证通过的 SWR/SIE Hit / 总请求。',
      byteHitRate:
        '由缓存直接服务的请求对应字节 / 总需求字节；同样可能被 Unsafe Hit 虚高。',
      safeByteHitRate:
        '由安全 Fresh/Stale Hit 服务的字节 / 总需求字节。',
      computeSavedRatio:
        '(无缓存基线 Compute Unit - 实际 Origin 尝试 Compute Unit) / 无缓存基线 Compute Unit。每次成功、失败或崩溃的 Origin 尝试都按 Manifest 中的 Compute Unit 计账。',
      originCalls: '实际启动的 Origin 尝试次数，包含失败、后台刷新与崩溃后恢复。',
      fillAmplification:
        'Origin Calls / 触发过 Origin 的逻辑 Fill Cohort 数。理想 Singleflight Cohort 为 1；Owner 崩溃恢复可有有界的大于 1。',
      unsafeHits:
        'Generation、Permission、模型身份、Payload 完整性或语义答案不匹配，却仍被负对照配置服务的请求数。',
      semanticFalseHits:
        'Semantic Group 命中但 Answer Oracle 不同的请求数；它是 Unsafe Hit 的子集。',
      evictions: '容量策略移除条目数；不包含 Expiration、显式 Invalidation 与 Admission Reject。',
      latencyPercentiles:
        '基于虚拟时钟的 nearest-rank p50/p95/p99；不包含真实网络或运行时抖动。',
    },
    results,
    assertions: buildAssertions(results),
  };
}

export function markdownReport(report: LabReport): string {
  const rows = report.results
    .map((result) => {
      const m = result.metrics;
      return `| ${result.configId} | ${m.requestHitRate.toFixed(3)} | ${m.safeRequestHitRate.toFixed(3)} | ${m.byteHitRate.toFixed(3)} | ${m.computeSavedRatio.toFixed(3)} | ${m.originCalls} | ${m.fillAmplification.toFixed(3)} | ${m.unsafeHits} | ${m.semanticFalseHits} | ${m.evictions} | ${m.latencyMs.p50}/${m.latencyMs.p95}/${m.latencyMs.p99} |`;
    })
    .join('\n');
  const assertionRows = report.assertions
    .map(
      (assertion) =>
        `| ${assertion.passed ? 'PASS' : 'FAIL'} | ${assertion.id} | ${escapePipe(assertion.expected)} | ${escapePipe(assertion.actual)} |`,
    )
    .join('\n');

  return `# Deterministic Cache Lab Report

> ${report.manifestDescription}

## Strategy comparison

| Config | Request Hit | Safe Hit | Byte Hit | Compute Saved | Origin Calls | Fill Amp | Unsafe | Semantic False | Evictions | Latency p50/p95/p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${rows}

## Acceptance assertions

| Result | Assertion | Expected | Actual |
|---|---|---|---|
${assertionRows}

## Interpretation boundary

- 这些结果只说明给定 Manifest 和策略实现的行为，不外推为生产吞吐或命中率。
- \`frequency-admission\` 是用于讲清 Admission 与 Eviction 差异的简化策略，不是 Caffeine W-TinyLFU 的复刻。
- \`semantic-negative-control\` 故意制造 False Hit；它不是发布建议。
- Raw Hit/Byte Hit 可能被 Unsafe Hit 虚高，验收应以 Safe Hit、Unsafe Hit 和具体请求断言为准。
`;
}

function escapePipe(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function printSummary(report: LabReport): void {
  const headers = [
    'config',
    'hit',
    'safeHit',
    'byteHit',
    'computeSaved',
    'origin',
    'fillAmp',
    'unsafe',
    'semFalse',
    'evict',
    'p50/p95/p99',
  ];
  const rows = report.results.map((result) => {
    const m = result.metrics;
    return [
      result.configId,
      m.requestHitRate.toFixed(3),
      m.safeRequestHitRate.toFixed(3),
      m.byteHitRate.toFixed(3),
      m.computeSavedRatio.toFixed(3),
      String(m.originCalls),
      m.fillAmplification.toFixed(3),
      String(m.unsafeHits),
      String(m.semanticFalseHits),
      String(m.evictions),
      `${m.latencyMs.p50}/${m.latencyMs.p95}/${m.latencyMs.p99}`,
    ];
  });
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const format = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join('  ');
  console.log(format(headers));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) console.log(format(row));

  const failed = report.assertions.filter((assertion) => !assertion.passed);
  console.log(`\nAssertions: ${report.assertions.length - failed.length}/${report.assertions.length} passed.`);
  for (const assertion of failed) {
    console.error(`FAIL ${assertion.id}: expected ${assertion.expected}; actual ${assertion.actual}`);
  }
}

interface CliOptions {
  manifestPath: string;
  outPath?: string;
  markdownPath?: string;
  selfTest: boolean;
}

function parseCli(argv: string[]): CliOptions {
  const defaultManifest = path.join(process.cwd(), 'cache-lab-manifest.json');
  const options: CliOptions = {
    manifestPath: defaultManifest,
    selfTest: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--manifest') {
      options.manifestPath = requireValue(argv, ++i, '--manifest');
    } else if (arg === '--out') {
      options.outPath = requireValue(argv, ++i, '--out');
    } else if (arg === '--markdown') {
      options.markdownPath = requireValue(argv, ++i, '--markdown');
    } else if (arg === '--self-test') {
      options.selfTest = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  node deterministic-cache-lab.js [options]

Options:
  --manifest <path>   Input manifest (default: ./cache-lab-manifest.json)
  --out <path>        Write structured JSON report
  --markdown <path>   Write Markdown summary
  --self-test         Exit non-zero when an acceptance assertion fails
  --help              Show this message`);
      process.exitCode = 0;
      return options;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value.`);
  return value;
}

function main(): void {
  try {
    const options = parseCli(process.argv.slice(2));
    const manifestPath = path.resolve(options.manifestPath);
    const manifest = readManifest(manifestPath);
    const report = buildReport(manifest);
    printSummary(report);

    if (options.outPath) {
      const outPath = path.resolve(options.outPath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      console.log(`JSON report: ${outPath}`);
    }
    if (options.markdownPath) {
      const markdownPath = path.resolve(options.markdownPath);
      fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
      fs.writeFileSync(markdownPath, markdownReport(report), 'utf8');
      console.log(`Markdown report: ${markdownPath}`);
    }

    if (options.selfTest && report.assertions.some((assertion) => !assertion.passed)) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const modulePath = fileURLToPath(import.meta.url);

if (invokedPath === modulePath) {
  main();
}

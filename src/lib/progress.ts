export const MODULE_PROGRESS_KEY = 'ai-learning-terminal.progress.v1';

export type ModuleStatus = 'not-started' | 'in-progress' | 'completed';

export interface ModuleProgressRecord {
  status: ModuleStatus;
  updatedAt: string;
}

export interface LearningProgressV1 {
  version: 1;
  updatedAt?: string;
  modules: Record<string, ModuleProgressRecord>;
}

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const emptyProgress = (): LearningProgressV1 => ({ version: 1, modules: {} });
const validStatuses = new Set<ModuleStatus>(['not-started', 'in-progress', 'completed']);

export function loadLearningProgress(storage: Pick<ProgressStorage, 'getItem'>): LearningProgressV1 {
  try {
    const raw = storage.getItem(MODULE_PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1) {
      return emptyProgress();
    }

    const candidate = parsed as { updatedAt?: unknown; modules?: unknown };
    if (!candidate.modules || typeof candidate.modules !== 'object' || Array.isArray(candidate.modules)) {
      return emptyProgress();
    }

    const modules: Record<string, ModuleProgressRecord> = {};
    for (const [moduleId, value] of Object.entries(candidate.modules)) {
      if (!value || typeof value !== 'object') continue;
      const record = value as { status?: unknown; updatedAt?: unknown };
      if (!validStatuses.has(record.status as ModuleStatus) || typeof record.updatedAt !== 'string') continue;
      modules[moduleId] = { status: record.status as ModuleStatus, updatedAt: record.updatedAt };
    }

    return {
      version: 1,
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
      modules,
    };
  } catch {
    return emptyProgress();
  }
}

export function setModuleStatus(
  storage: ProgressStorage,
  moduleId: string,
  status: ModuleStatus,
  now = new Date().toISOString(),
): LearningProgressV1 {
  const current = loadLearningProgress(storage);
  const next: LearningProgressV1 = {
    version: 1,
    updatedAt: now,
    modules: {
      ...current.modules,
      [moduleId]: { status, updatedAt: now },
    },
  };
  storage.setItem(MODULE_PROGRESS_KEY, JSON.stringify(next));
  return next;
}

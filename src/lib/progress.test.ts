import { describe, expect, it } from 'vitest';
import { loadLearningProgress, setModuleStatus } from './progress';

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; },
    read: () => value,
  };
}

describe('local learning progress', () => {
  it('falls back safely when stored JSON is invalid', () => {
    const storage = memoryStorage('{broken');
    expect(loadLearningProgress(storage).modules).toEqual({});
  });

  it('ignores progress from an unknown schema version', () => {
    const storage = memoryStorage(JSON.stringify({ version: 99, modules: { old: { status: 'completed' } } }));
    expect(loadLearningProgress(storage).modules).toEqual({});
  });

  it('updates one module without losing another module', () => {
    const storage = memoryStorage();
    setModuleStatus(storage, 'network-streaming', 'completed', '2026-07-21T12:00:00.000Z');
    setModuleStatus(storage, 'workflow-vs-agent', 'in-progress', '2026-07-21T13:00:00.000Z');

    const saved = loadLearningProgress(storage);
    expect(saved.version).toBe(1);
    expect(saved.modules['network-streaming'].status).toBe('completed');
    expect(saved.modules['workflow-vs-agent'].status).toBe('in-progress');
    expect(saved.updatedAt).toBe('2026-07-21T13:00:00.000Z');
  });
});

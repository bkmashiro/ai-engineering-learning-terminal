// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MODULE_PROGRESS_KEY } from '../../lib/progress';
import { ModuleProgress } from './ModuleProgress';

let values = new Map<string, string>();
const testStorage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => { values.delete(key); },
  setItem: (key, value) => { values.set(key, value); },
};

beforeEach(() => {
  values = new Map();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: testStorage });
});
afterEach(cleanup);

describe('ModuleProgress', () => {
  it('marks a module complete and persists it in this browser', () => {
    render(<ModuleProgress moduleId="workflow-vs-agent" />);

    fireEvent.click(screen.getByRole('button', { name: '标记本课完成' }));

    expect(screen.getByRole('status').textContent).toContain('已完成');
    const saved = JSON.parse(localStorage.getItem(MODULE_PROGRESS_KEY) ?? '{}');
    expect(saved.modules['workflow-vs-agent'].status).toBe('completed');
  });
});

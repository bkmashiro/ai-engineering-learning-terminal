import { describe, expect, it } from 'vitest';
import { chooseArchitecture } from './architectureDecision';

describe('architecture decision map', () => {
  it('keeps known paths as a workflow even when side effects are risky', () => {
    expect(chooseArchitecture(20, 85).kind).toBe('workflow');
  });

  it('uses a controlled agent for uncertain, low-risk paths', () => {
    expect(chooseArchitecture(80, 25).kind).toBe('agent');
  });

  it('wraps an agent in a workflow for uncertain, high-risk paths', () => {
    expect(chooseArchitecture(80, 85).kind).toBe('hybrid');
  });
});

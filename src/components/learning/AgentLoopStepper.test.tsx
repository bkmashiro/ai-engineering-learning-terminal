// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { AgentLoopStepper } from './AgentLoopStepper';

afterEach(cleanup);

describe('AgentLoopStepper', () => {
  it('starts from an observable state and advances one public step at a time', () => {
    render(<AgentLoopStepper />);

    expect(screen.getByRole('img', { name: 'Agent Loop 状态图' })).toBeTruthy();
    expect(screen.getByTestId('loop-node-observe').getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('heading', { name: '观察输入' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByTestId('loop-node-decide').getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('heading', { name: '选择动作' })).toBeTruthy();
  });

  it('stops at a tool timeout instead of pretending the loop succeeded', () => {
    render(<AgentLoopStepper />);

    fireEvent.change(screen.getByLabelText('故障场景'), { target: { value: 'timeout' } });
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    expect(screen.getByRole('status').textContent).toContain('工具超时');
    expect(screen.getByTestId('loop-node-act').getAttribute('data-state')).toBe('fault');
    expect(screen.getByTestId('recovery-card').textContent).toContain('STOP · RECOVER');
    expect(screen.getByTestId('recovery-card').textContent).toContain('停止 · 恢复 · 复核');
    expect((screen.getByRole('button', { name: '下一步' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

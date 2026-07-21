// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { ArchitectureDecisionMap } from './ArchitectureDecisionMap';

afterEach(cleanup);

describe('ArchitectureDecisionMap', () => {
  it('moves from workflow to agent to hybrid as uncertainty and risk change', () => {
    render(<ArchitectureDecisionMap />);

    expect(screen.getByRole('status').textContent).toContain('固定 Workflow');

    fireEvent.input(screen.getByLabelText('路径不确定性'), { target: { value: '80' } });
    expect(screen.getByRole('status').textContent).toContain('受控 Agent');

    fireEvent.input(screen.getByLabelText('副作用风险'), { target: { value: '85' } });
    expect(screen.getByRole('status').textContent).toContain('Workflow 包围 Agent');
  });
});

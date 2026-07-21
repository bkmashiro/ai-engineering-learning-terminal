import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('foundation lesson depth contracts', () => {
  it('teaches network streaming as a lifecycle with recovery semantics', () => {
    const lesson = readSource('./content/docs/foundations/software-systems/network-streaming.mdx');

    expect(lesson.length).toBeGreaterThan(9_000);
    expect(lesson).toContain('DNS → TCP → TLS → HTTP');
    expect(lesson).toContain('text/event-stream');
    expect(lesson).toContain('Last-Event-ID');
    expect(lesson).toContain('Deadline预算要逐层递减');
    expect(lesson).toContain('重试决策表');
    expect(lesson).toContain('积压增长率 = 到达速率 - 处理速率');
    expect(lesson).toContain('故障诊断表');
    expect(lesson).toContain('estimatedMinutes: 75');
    expect(lesson).toContain('difficulty: core');
  });

  it('derives attention and connects it to inference engineering', () => {
    const lesson = readSource('./content/docs/foundations/llm/index.mdx');

    expect(lesson.length).toBeGreaterThan(12_000);
    expect(lesson).toContain('Q = XW_Q');
    expect(lesson).toContain('softmax(QK^T / √d_k)V');
    expect(lesson).toContain('<Term id="causal-mask" />');
    expect(lesson).toContain('<Term id="multi-head-attention" />');
    expect(lesson).toContain('<Term id="positional-representation" />');
    expect(lesson).toContain('O(n²d)');
    expect(lesson).toContain('KV Cache');
    expect(lesson).toContain('Attention权重不是解释');
    expect(lesson).toContain('estimatedMinutes: 90');
    expect(lesson).toContain('difficulty: core');
  });

  it('keeps system diagram labels in CSS-sized HTML instead of scaled SVG text', () => {
    const diagram = readSource('./components/content/SystemStackDiagram.astro');

    expect(diagram).not.toContain('<svg');
    expect(diagram).toContain('system-stack__heading');
    expect(diagram).toContain('system-stack__scope');
    expect(diagram).toContain('font-size: 1rem');
  });
});

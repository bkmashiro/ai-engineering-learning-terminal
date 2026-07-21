import { describe, expect, it } from 'vitest';
import { findPublicContentViolations } from '../scripts/audit-public-content';

describe('public content policy', () => {
  it('accepts generic Chinese teaching content', () => {
    expect(findPublicContentViolations('工具调用需要参数校验、超时与审计。', 'lesson.mdx')).toEqual([]);
  });

  it('rejects private local paths and application material', () => {
    const violations = findPublicContentViolations(
      '读取 /Users/example/private/profile.md；投递状态：已提交。',
      'leak.mdx',
    );

    expect(violations.map((item) => item.rule)).toContain('absolute-local-path');
    expect(violations.map((item) => item.rule)).toContain('application-content');
  });

  it('rejects likely secrets', () => {
    const violations = findPublicContentViolations(
      'token=abcdefghijklmnopqrstuvwxyz123456',
      'secret.txt',
    );

    expect(violations.map((item) => item.rule)).toContain('secret');
  });
});

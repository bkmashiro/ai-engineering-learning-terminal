import { describe, expect, it } from 'vitest';
import { publicSources, validateSources } from './sources';

describe('public sources', () => {
  it('has unique IDs and review dates', () => {
    expect(validateSources(publicSources)).toEqual([]);
  });

  it('rejects duplicate IDs and invalid dates', () => {
    const broken = [
      publicSources[0],
      { ...publicSources[0], accessedAt: 'July 21' },
    ];

    const errors = validateSources(broken).join('\n');
    expect(errors).toContain('duplicate source id');
    expect(errors).toContain('invalid accessedAt');
  });
});

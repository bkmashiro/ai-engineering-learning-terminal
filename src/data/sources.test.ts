import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { publicSources, validateSources } from './sources';

function collectMdxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectMdxFiles(path) : extname(path) === '.mdx' ? [path] : [];
  });
}

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

  it('resolves every course source ID through the canonical registry', () => {
    const known = new Set(publicSources.map((source) => source.id));
    const docsRoot = fileURLToPath(new URL('../content/docs/', import.meta.url));
    const unresolved: string[] = [];

    for (const path of collectMdxFiles(docsRoot)) {
      const source = readFileSync(path, 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const block = frontmatter.match(/^sourceIds:\n((?:  - .+\n?)*)/m)?.[1] ?? '';
      for (const id of [...block.matchAll(/^  - (.+)$/gm)].map((match) => match[1])) {
        if (id && !known.has(id)) unresolved.push(`${path}: ${id}`);
      }
    }

    expect(unresolved).toEqual([]);
  });
});

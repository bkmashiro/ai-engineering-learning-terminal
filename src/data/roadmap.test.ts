import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { roadmapNodes, validateRoadmap, type RoadmapNode } from './roadmap';

describe('roadmap graph', () => {
  const docsRoot = fileURLToPath(new URL('../content/docs/', import.meta.url));

  const contentPathFor = (href: string): string => {
    const relative = href.replace(/^\//, '').replace(/\/$/, '');
    const direct = `${docsRoot}${relative}.mdx`;
    return existsSync(direct) ? direct : `${docsRoot}${relative}/index.mdx`;
  };

  it('accepts the published roadmap', () => {
    expect(validateRoadmap(roadmapNodes)).toEqual([]);
  });

  it('rejects duplicate IDs and missing prerequisites', () => {
    const broken: RoadmapNode[] = [
      { ...roadmapNodes[0] },
      { ...roadmapNodes[0], prerequisites: ['missing-node'] },
    ];
    const errors = validateRoadmap(broken).join('\n');

    expect(errors).toContain('duplicate node id');
    expect(errors).toContain('missing prerequisite');
  });

  it('rejects cycles', () => {
    const broken: RoadmapNode[] = [
      { ...roadmapNodes[0], id: 'a', prerequisites: ['b'] },
      { ...roadmapNodes[1], id: 'b', prerequisites: ['a'] },
    ];

    expect(validateRoadmap(broken).join('\n')).toContain('cycle');
  });

  it('backs every available route with a content file', () => {
    const missing = roadmapNodes
      .filter((node) => node.status === 'available')
      .filter((node) => {
        const relative = node.href.replace(/^\//, '').replace(/\/$/, '');
        return !existsSync(`${docsRoot}${relative}.mdx`) && !existsSync(`${docsRoot}${relative}/index.mdx`);
      })
      .map((node) => `${node.id}: ${node.href}`);

    expect(missing).toEqual([]);
  });

  it('keeps available lesson metadata aligned with the canonical roadmap', () => {
    const mismatches: string[] = [];

    for (const node of roadmapNodes.filter((candidate) => candidate.status === 'available')) {
      const source = readFileSync(contentPathFor(node.href), 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const moduleId = frontmatter.match(/^moduleId: (.+)$/m)?.[1];
      const prerequisiteBlock = frontmatter.match(/^prerequisites:\n((?:  - .+\n?)*)/m)?.[1] ?? '';
      const prerequisites = [...prerequisiteBlock.matchAll(/^  - (.+)$/gm)].map((match) => match[1]);

      if (moduleId !== node.id) {
        mismatches.push(`${node.id}: frontmatter moduleId is ${moduleId ?? 'missing'}`);
      }
      if (JSON.stringify(prerequisites) !== JSON.stringify(node.prerequisites)) {
        mismatches.push(
          `${node.id}: frontmatter prerequisites ${JSON.stringify(prerequisites)} != roadmap ${JSON.stringify(node.prerequisites)}`,
        );
      }
    }

    expect(mismatches).toEqual([]);
  });
});

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { roadmapNodes, validateRoadmap, type RoadmapNode } from './roadmap';

describe('roadmap graph', () => {
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
    const docsRoot = fileURLToPath(new URL('../content/docs/', import.meta.url));
    const missing = roadmapNodes
      .filter((node) => node.status === 'available')
      .filter((node) => {
        const relative = node.href.replace(/^\//, '').replace(/\/$/, '');
        return !existsSync(`${docsRoot}${relative}.mdx`) && !existsSync(`${docsRoot}${relative}/index.mdx`);
      })
      .map((node) => `${node.id}: ${node.href}`);

    expect(missing).toEqual([]);
  });
});

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
});

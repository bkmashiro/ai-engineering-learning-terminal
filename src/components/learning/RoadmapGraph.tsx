import { useMemo, useState } from 'preact/hooks';
import { careerDirections } from '../../data/directions';
import {
  roadmapNodes,
  stageIds,
  stageLabels,
  type DirectionId,
  type RoadmapNode,
} from '../../data/roadmap';
import './RoadmapGraph.css';

type Filter = 'all' | DirectionId;

const byId = new Map(roadmapNodes.map((node) => [node.id, node]));
const directionTitle = new Map(careerDirections.map((direction) => [direction.id, direction.title]));

function dependencyClosure(nodes: RoadmapNode[], direction: DirectionId): Set<string> {
  const visible = new Set(nodes.filter((node) => node.directions.includes(direction)).map((node) => node.id));
  const visit = (id: string) => {
    const node = byId.get(id);
    if (!node) return;
    visible.add(id);
    for (const prerequisite of node.prerequisites) visit(prerequisite);
  };
  for (const id of [...visible]) visit(id);
  return visible;
}

export function RoadmapGraph() {
  const [filter, setFilter] = useState<Filter>('all');
  const visibleIds = useMemo(
    () => (filter === 'all' ? new Set(roadmapNodes.map((node) => node.id)) : dependencyClosure(roadmapNodes, filter)),
    [filter],
  );

  return (
    <section class="roadmap" aria-labelledby="roadmap-heading">
      <div class="roadmap__intro">
        <div>
          <p class="roadmap__eyebrow">COMMON TRUNK FIRST</p>
          <h2 id="roadmap-heading">从共同底座走到方向分支</h2>
          <p>筛选方向只会突出相关路径，不会隐藏它依赖的共同基础。</p>
        </div>
        <label class="roadmap__filter">
          <span>查看路径</span>
          <select value={filter} onChange={(event) => setFilter(event.currentTarget.value as Filter)}>
            <option value="all">完整路线</option>
            {careerDirections.map((direction) => (
              <option value={direction.id}>{direction.title}</option>
            ))}
          </select>
        </label>
      </div>

      <div class="roadmap__stages">
        {stageIds.map((stageId) => {
          const nodes = roadmapNodes
            .filter((node) => node.stage === stageId && visibleIds.has(node.id))
            .sort((left, right) => left.order - right.order);
          if (nodes.length === 0) return null;
          return (
            <section class="roadmap__stage" aria-labelledby={`stage-${stageId}`}>
              <h3 id={`stage-${stageId}`}>{stageLabels[stageId]}</h3>
              <div class="roadmap__nodes">
                {nodes.map((node) => {
                  const title = node.stage === 'directions' ? directionTitle.get(node.directions[0]) ?? node.title : node.title;
                  const content = (
                    <>
                      <div class="roadmap__node-heading">
                        <strong>{title}</strong>
                        <span class={node.status === 'available' ? 'is-available' : ''}>
                          {node.status === 'available' ? '可学习' : '计划中'}
                        </span>
                      </div>
                      <p>{node.summary}</p>
                      <small>产物：{node.artifact}</small>
                    </>
                  );
                  return node.status === 'available' ? (
                    <a class="roadmap__node" id={node.id} href={node.href}>{content}</a>
                  ) : (
                    <article class="roadmap__node" id={node.id} aria-label={`${title}，计划中`}>{content}</article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export const stageIds = [
  'reproducibility',
  'software-systems',
  'ml-foundations',
  'llm-applications',
  'agent-core',
  'safety-evaluation',
  'production-capstone',
  'directions',
] as const;

export type StageId = (typeof stageIds)[number];

export const directionIds = [
  'agent-applications',
  'agent-runtime-evaluation',
  'ai-backend-reliability',
  'llm-search-retrieval',
  'gui-multimodal-agents',
  'game-ai-interactive-narrative',
  'edge-inference',
] as const;

export type DirectionId = (typeof directionIds)[number];

export interface RoadmapNode {
  id: string;
  title: string;
  summary: string;
  stage: StageId;
  order: number;
  prerequisites: string[];
  outcomes: string[];
  artifact: string;
  directions: DirectionId[];
  href: string;
  status: 'available' | 'planned';
}

export const stageLabels: Record<StageId, string> = {
  reproducibility: '0 · 可复现学习',
  'software-systems': '1 · 软件与系统',
  'ml-foundations': '2 · 数学与机器学习',
  'llm-applications': '3 · LLM 应用',
  'agent-core': '4 · Agent 工程',
  'safety-evaluation': '5 · 安全、评测与可靠性',
  'production-capstone': '6 · 生产化与综合项目',
  directions: '7 · 就业方向',
};

export const roadmapNodes: RoadmapNode[] = [
  {
    id: 'evidence-first',
    title: '可复现与证据',
    summary: '把输入、输出、状态、副作用和来源记录清楚。',
    stage: 'reproducibility',
    order: 0,
    prerequisites: [],
    outcomes: ['可复现实验', '失败优先报告'],
    artifact: '一个带验证和 trace 的确定性 CLI',
    directions: [],
    href: '/foundations/reproducibility/',
    status: 'planned',
  },
  {
    id: 'state-events',
    title: '状态、事件与复杂度',
    summary: '用数据结构和状态机描述系统如何变化。',
    stage: 'software-systems',
    order: 1,
    prerequisites: ['evidence-first'],
    outcomes: ['状态机建模', '复杂度判断'],
    artifact: '可测试的任务状态机',
    directions: [],
    href: '/foundations/software-systems/state-and-events/',
    status: 'planned',
  },
  {
    id: 'network-streaming',
    title: '网络、流式与取消',
    summary: '从请求分层定位，走到SSE续传、Deadline传播、幂等重试与背压诊断。',
    stage: 'software-systems',
    order: 2,
    prerequisites: ['state-events'],
    outcomes: ['设计可回放事件流', '诊断取消、重试与积压'],
    artifact: '带游标、终态、取消和故障矩阵的事件流',
    directions: ['ai-backend-reliability', 'agent-applications'],
    href: '/foundations/software-systems/network-streaming/',
    status: 'available',
  },
  {
    id: 'data-reliability',
    title: '事务、缓存与队列',
    summary: '管理持久状态、重复请求和异步任务。',
    stage: 'software-systems',
    order: 3,
    prerequisites: ['network-streaming'],
    outcomes: ['幂等设计', '一致性取舍'],
    artifact: '带幂等键和补偿的任务处理器',
    directions: ['ai-backend-reliability', 'agent-runtime-evaluation'],
    href: '/foundations/software-systems/data-reliability/',
    status: 'planned',
  },
  {
    id: 'ml-experiments',
    title: '机器学习与实验',
    summary: '从数据切分、指标和误差分析理解模型证据。',
    stage: 'ml-foundations',
    order: 4,
    prerequisites: ['evidence-first'],
    outcomes: ['识别数据泄漏', '解释指标边界'],
    artifact: '带误差分析的小型分类实验',
    directions: ['llm-search-retrieval', 'edge-inference'],
    href: '/foundations/ml/',
    status: 'planned',
  },
  {
    id: 'llm-foundations',
    title: 'Token、Attention 与上下文',
    summary: '从Tokenizer和Q/K/V计算，走到Mask、多头、KV Cache与上下文预算。',
    stage: 'llm-applications',
    order: 5,
    prerequisites: ['ml-experiments'],
    outcomes: ['手算缩放点积Attention', '诊断推理与上下文成本'],
    artifact: 'Attention手算与上下文干扰实验',
    directions: ['llm-search-retrieval', 'edge-inference'],
    href: '/foundations/llm/',
    status: 'available',
  },
  {
    id: 'retrieval-grounding',
    title: '检索、引用与无答案',
    summary: '把召回、排序、上下文和评测连成闭环。',
    stage: 'llm-applications',
    order: 6,
    prerequisites: ['llm-foundations', 'data-reliability'],
    outcomes: ['设计 RAG', '诊断检索失败'],
    artifact: '带引用和评测集的检索演示',
    directions: ['llm-search-retrieval', 'agent-applications'],
    href: '/foundations/llm/retrieval/',
    status: 'planned',
  },
  {
    id: 'workflow-vs-agent',
    title: 'Workflow 与 Agent',
    summary: '先判断何时需要模型决策，何时固定流程更可靠。',
    stage: 'agent-core',
    order: 7,
    prerequisites: ['network-streaming', 'llm-foundations'],
    outcomes: ['区分工作流与 Agent', '选择最小架构'],
    artifact: 'Agent Loop 故障注入实验',
    directions: ['agent-applications', 'agent-runtime-evaluation', 'ai-backend-reliability'],
    href: '/agent/workflow-vs-agent/',
    status: 'available',
  },
  {
    id: 'agent-state-tools',
    title: '状态、工具与记忆',
    summary: '控制工具权限、循环、记忆写入和终止条件。',
    stage: 'agent-core',
    order: 8,
    prerequisites: ['workflow-vs-agent', 'retrieval-grounding'],
    outcomes: ['工具契约', '状态与记忆边界'],
    artifact: '有限步、可取消、可审计的 Runner',
    directions: ['agent-applications', 'agent-runtime-evaluation', 'gui-multimodal-agents'],
    href: '/agent/state-tools-memory/',
    status: 'planned',
  },
  {
    id: 'safety-evaluation',
    title: '安全、评测与回放',
    summary: '用威胁模型、评测集和 trace 证明系统边界。',
    stage: 'safety-evaluation',
    order: 9,
    prerequisites: ['agent-state-tools'],
    outcomes: ['最小权限', '可执行评测'],
    artifact: '攻防用例和可回放评测报告',
    directions: ['agent-runtime-evaluation', 'ai-backend-reliability', 'gui-multimodal-agents'],
    href: '/safety-evaluation/',
    status: 'planned',
  },
  {
    id: 'production-capstone',
    title: '生产化综合项目',
    summary: '连接 API、存储、队列、trace、成本和人工接管。',
    stage: 'production-capstone',
    order: 10,
    prerequisites: ['safety-evaluation'],
    outcomes: ['端到端设计', '质量/延迟/成本取舍'],
    artifact: '可回放、可评测的最小 Agent 系统',
    directions: [],
    href: '/capstone/',
    status: 'planned',
  },
  ...directionIds.map<RoadmapNode>((direction, index) => ({
    id: `direction-${direction}`,
    title: direction,
    summary: '在共同底座之上选择性深入。',
    stage: 'directions',
    order: 20 + index,
    prerequisites: ['production-capstone'],
    outcomes: ['方向能力地图', '作品证据计划'],
    artifact: '一个方向专项作品',
    directions: [direction],
    href: `/directions/${direction}/`,
    status: 'planned',
  })),
];

export function validateRoadmap(nodes: RoadmapNode[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`duplicate node id: ${node.id}`);
    ids.add(node.id);
  }
  for (const node of nodes) {
    for (const prerequisite of node.prerequisites) {
      if (!ids.has(prerequisite)) errors.push(`missing prerequisite ${prerequisite} for ${node.id}`);
    }
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visit = (id: string): void => {
    if (state.get(id) === 'visiting') {
      errors.push(`cycle detected at ${id}`);
      return;
    }
    if (state.get(id) === 'visited') return;
    state.set(id, 'visiting');
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite);
    state.set(id, 'visited');
  };
  for (const node of nodes) visit(node.id);
  return [...new Set(errors)];
}

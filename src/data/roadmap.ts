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
  directions: '7 · 方向专项',
};

export const roadmapNodes: RoadmapNode[] = [
  {
    id: 'evidence-first',
    title: '可复现与证据',
    summary: '把Manifest、版本身份、结构化结果、Trace、副作用和Artifact验证组成最小Evidence Bundle。',
    stage: 'reproducibility',
    order: 0,
    prerequisites: [],
    outcomes: ['构建确定性CLI', '识别假成功', '按事实、推导与假设报告失败'],
    artifact: '一个验证输入、产物和副作用并输出Evidence Bundle的确定性CLI',
    directions: [],
    href: '/foundations/reproducibility/',
    status: 'available',
  },
  {
    id: 'state-events',
    title: '状态、事件与复杂度',
    summary: '用命令、事件、状态转换、不变量和版本冲突控制异步任务生命周期。',
    stage: 'software-systems',
    order: 1,
    prerequisites: ['evidence-first'],
    outcomes: ['设计可执行状态转移表', '拒绝非法与过期写入', '用事件和快照恢复状态'],
    artifact: '带版本检查、去重、回放和故障测试的任务状态机',
    directions: [],
    href: '/foundations/software-systems/state-and-events/',
    status: 'available',
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
    summary: '在数据库、缓存、消息代理和外部副作用之间，用幂等记录、Outbox、去重、对账与补偿收敛。',
    stage: 'software-systems',
    order: 3,
    prerequisites: ['network-streaming'],
    outcomes: ['设计幂等命令与并发事务', '判断缓存一致性边界', '处理重复投递与部分失败'],
    artifact: '带幂等键、事务性Outbox、副作用账本和补偿的任务处理器',
    directions: ['ai-backend-reliability', 'agent-runtime-evaluation'],
    href: '/foundations/software-systems/data-reliability/',
    status: 'available',
  },
  {
    id: 'data-asset-lifecycle',
    title: '数据资产生命周期',
    summary: '用来源身份、不可变版本、派生血缘、变更事件和Generation切换管理数据更新、删除、权限收紧与重建。',
    stage: 'software-systems',
    order: 4,
    prerequisites: ['data-reliability'],
    outcomes: ['设计版本化数据资产图', '传播更新、删除与权限变更', '用新鲜度和完整性门禁发布派生产物'],
    artifact: '能计算影响集、重建派生产物并原子切换Generation的数据生命周期演示',
    directions: ['llm-search-retrieval', 'ai-backend-reliability'],
    href: '/foundations/software-systems/data-asset-lifecycle/',
    status: 'available',
  },
  {
    id: 'ml-experiments',
    title: '机器学习与实验',
    summary: '从预测时可见信息出发设计数据切分、Pipeline、指标、阈值与误差分析，避免把泄漏当能力。',
    stage: 'ml-foundations',
    order: 5,
    prerequisites: ['evidence-first'],
    outcomes: ['识别数据泄漏', '手算分类指标', '解释误差切片和指标边界'],
    artifact: '带固定切分、Pipeline、混淆矩阵和误差清单的小型分类实验',
    directions: ['llm-search-retrieval', 'edge-inference'],
    href: '/foundations/ml/',
    status: 'available',
  },
  {
    id: 'llm-foundations',
    title: 'Token、Attention 与上下文',
    summary: '从Tokenizer和Q/K/V计算，走到Mask、多头、KV Cache与上下文预算。',
    stage: 'llm-applications',
    order: 6,
    prerequisites: ['ml-experiments'],
    outcomes: ['手算缩放点积Attention', '诊断推理与上下文成本'],
    artifact: 'Attention手算与上下文干扰实验',
    directions: ['llm-search-retrieval', 'edge-inference'],
    href: '/foundations/llm/',
    status: 'available',
  },
  {
    id: 'model-serving-governance',
    title: '模型服务、路由与推理预算',
    summary: '把排队、Prefill、Decode、KV容量、连续批处理、版本路由、降级与成本做成可测量的模型服务控制面。',
    stage: 'llm-applications',
    order: 7,
    prerequisites: ['llm-foundations', 'network-streaming'],
    outcomes: ['拆解TTFT与Token间延迟', '设计准入、路由与负载保护', '用SLO、成本和版本证据控制发布'],
    artifact: '带准入预算、确定性路由、降级理由与分阶段指标的模型服务适配层',
    directions: ['ai-backend-reliability', 'agent-runtime-evaluation', 'edge-inference'],
    href: '/foundations/llm/model-serving-governance/',
    status: 'available',
  },
  {
    id: 'retrieval-grounding',
    title: '检索、引用与无答案',
    summary: '把文档身份、分块、召回、重排、上下文打包、引用绑定和无答案评测连成一条可诊断流水线。',
    stage: 'llm-applications',
    order: 8,
    prerequisites: ['llm-foundations', 'data-asset-lifecycle'],
    outcomes: ['设计可追踪RAG流水线', '手算检索指标', '区分检索、生成与引用失败'],
    artifact: '带索引版本、引用、无答案策略和评测集的检索演示',
    directions: ['llm-search-retrieval', 'agent-applications'],
    href: '/foundations/llm/retrieval/',
    status: 'available',
  },
  {
    id: 'workflow-vs-agent',
    title: 'Workflow 与 Agent',
    summary: '从编排模式、控制循环、预算与终止条件判断何时使用固定流程、模型路由或受控Agent。',
    stage: 'agent-core',
    order: 9,
    prerequisites: ['model-serving-governance'],
    outcomes: ['选择最小编排模式', '设计可验证控制循环', '计算预算并正确停止'],
    artifact: '带预算、重复检测、完成验证和五类故障注入的受控Agent Loop',
    directions: ['agent-applications', 'agent-runtime-evaluation', 'ai-backend-reliability'],
    href: '/agent/workflow-vs-agent/',
    status: 'available',
  },
  {
    id: 'agent-state-tools',
    title: '状态、工具与记忆',
    summary: '用工具契约、能力令牌、权威运行状态和分层记忆构建有限步、可取消、可审计的Runner。',
    stage: 'agent-core',
    order: 10,
    prerequisites: ['workflow-vs-agent', 'retrieval-grounding'],
    outcomes: ['定义工具契约与权限', '区分状态、工作记忆与长期记忆', '实现停止、取消和人工接管'],
    artifact: '有限步、可取消、可审计并可故障注入的Runner',
    directions: ['agent-applications', 'agent-runtime-evaluation', 'gui-multimodal-agents'],
    href: '/agent/state-tools-memory/',
    status: 'available',
  },
  {
    id: 'safety-evaluation',
    title: '安全、评测与回放',
    summary: '从资产和信任边界建立威胁模型，把提示注入、越权与故障转成隔离执行、机器断言和可回放报告。',
    stage: 'safety-evaluation',
    order: 11,
    prerequisites: ['agent-state-tools'],
    outcomes: ['应用最小权限', '编写可执行攻防用例', '区分系统失败与评测无效'],
    artifact: '攻防用例、隔离Runner和可回放评测报告',
    directions: ['agent-runtime-evaluation', 'ai-backend-reliability', 'gui-multimodal-agents'],
    href: '/safety-evaluation/',
    status: 'available',
  },
  {
    id: 'production-capstone',
    title: '生产化综合项目',
    summary: '把API、状态、队列、检索、工具、安全评测、Trace、SLO、成本预算和人工接管组合成可运营系统。',
    stage: 'production-capstone',
    order: 12,
    prerequisites: ['safety-evaluation'],
    outcomes: ['完成端到端边界设计', '建立发布与回放门槛', '权衡质量、延迟、成本和可靠性'],
    artifact: '可回放、可评测、可降级并具备人工接管的最小Agent系统',
    directions: [],
    href: '/capstone/',
    status: 'available',
  },
  {
    id: 'direction-agent-applications',
    title: 'Agent 应用与产品工程',
    summary: '把长任务状态、流式反馈、恢复和人工接管做成用户能够理解与控制的产品边界。',
    stage: 'directions',
    order: 20,
    prerequisites: ['production-capstone'],
    outcomes: ['设计交互状态模型', '验证用户可控恢复路径'],
    artifact: '一个包含正常、失败、取消和接管路径的Agent应用',
    directions: ['agent-applications'],
    href: '/directions/agent-applications/',
    status: 'available',
  },
  {
    id: 'direction-agent-runtime-evaluation',
    title: 'Agent Runtime、Harness 与评测',
    summary: '构建隔离执行、工具模拟、Trace、回放、故障注入和差异报告基础设施。',
    stage: 'directions',
    order: 21,
    prerequisites: ['production-capstone'],
    outcomes: ['实现可控执行Harness', '建立可比较评测证据'],
    artifact: '一个能回放失败并生成差异报告的Runtime Harness',
    directions: ['agent-runtime-evaluation'],
    href: '/directions/agent-runtime-evaluation/',
    status: 'available',
  },
  {
    id: 'direction-ai-backend-reliability',
    title: 'AI 后端与可靠性工程',
    summary: '围绕流式API、状态、队列、存储、容量和成本构建故障下仍可收敛的服务。',
    stage: 'directions',
    order: 22,
    prerequisites: ['production-capstone'],
    outcomes: ['设计可靠异步边界', '用SLO和对账管理恢复'],
    artifact: '一个处理断线、重复请求、积压和Worker失败的服务骨架',
    directions: ['ai-backend-reliability'],
    href: '/directions/ai-backend-reliability/',
    status: 'available',
  },
  {
    id: 'direction-llm-search-retrieval',
    title: 'LLM、搜索与检索工程',
    summary: '围绕语料身份、混合召回、重排、Grounding和离线评测提升可核查答案质量。',
    stage: 'directions',
    order: 23,
    prerequisites: ['production-capstone'],
    outcomes: ['设计检索实验闭环', '定位召回与Grounding缺口'],
    artifact: '一个有可解释召回、引用和无答案处理的检索系统',
    directions: ['llm-search-retrieval'],
    href: '/directions/llm-search-retrieval/',
    status: 'available',
  },
  {
    id: 'direction-gui-multimodal-agents',
    title: 'GUI、OS 与多模态 Agent',
    summary: '把视觉或可访问树观察映射到受限动作，并用执行后状态验证而不是截图相似度判断成功。',
    stage: 'directions',
    order: 24,
    prerequisites: ['production-capstone'],
    outcomes: ['设计可验证GUI动作空间', '控制权限、重试与回滚'],
    artifact: '一个在可重置模拟界面上执行并验证动作的Lab',
    directions: ['gui-multimodal-agents'],
    href: '/directions/gui-multimodal-agents/',
    status: 'available',
  },
  {
    id: 'direction-game-ai-interactive-narrative',
    title: '游戏 AI 与交互式叙事',
    summary: '把确定性世界状态、行为选择、规划、记忆和生成内容分层，保证可玩性与叙事边界。',
    stage: 'directions',
    order: 25,
    prerequisites: ['production-capstone'],
    outcomes: ['区分模拟、决策与生成职责', '验证NPC行为和叙事约束'],
    artifact: '一个能解释状态、计划、记忆和Fallback的NPC系统',
    directions: ['game-ai-interactive-narrative'],
    href: '/directions/game-ai-interactive-narrative/',
    status: 'available',
  },
  {
    id: 'direction-edge-inference',
    title: '端侧与推理工程',
    summary: '在固定设备与质量门槛下测量模型转换、量化、算子支持、内存、延迟和能耗。',
    stage: 'directions',
    order: 26,
    prerequisites: ['production-capstone'],
    outcomes: ['建立端侧基准方法', '解释质量与资源取舍'],
    artifact: '一个包含误差、延迟、峰值内存和包体对比的端侧实验',
    directions: ['edge-inference'],
    href: '/directions/edge-inference/',
    status: 'available',
  },
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

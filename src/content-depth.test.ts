import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

interface CoreLessonContract {
  name: string;
  path: string;
  moduleId: string;
  mechanism: string;
  derivation: string;
  failureTable: string;
  experiment: string;
  canonicalTerm: string;
  component?: string;
}

const coreLessons: CoreLessonContract[] = [
  {
    name: 'evidence-first',
    path: './content/docs/foundations/reproducibility/index.mdx',
    moduleId: 'evidence-first',
    mechanism: 'Structured Result：成功和失败必须是不同数据形状',
    derivation: '三个故障注入实验',
    failureTable: '故障诊断矩阵',
    experiment: '实验一：Exit Code 0，但目标步骤没有运行',
    canonicalTerm: '<Term id="manifest" />',
    component: '<EvidenceBundleDiagram />',
  },
  {
    name: 'state-events',
    path: './content/docs/foundations/software-systems/state-and-events.mdx',
    moduleId: 'state-events',
    mechanism: '状态转换函数：保持纯函数边界',
    derivation: 'δ(Sᵢ₋₁, Eᵢ)',
    failureTable: '故障诊断矩阵',
    experiment: '至少三个故障注入实验',
    canonicalTerm: '<Term id="state-machine" />',
    component: '<StateTransitionDiagram />',
  },
  {
    name: 'data-reliability',
    path: './content/docs/foundations/software-systems/data-reliability.mdx',
    moduleId: 'data-reliability',
    mechanism: 'Transactional Outbox：让数据库状态与待发布事件一起提交',
    derivation: 'fingerprint = sha256',
    failureTable: '故障矩阵',
    experiment: '故障注入实验',
    canonicalTerm: '<Term id="transactional-outbox" />',
    component: '<ReliabilityBoundaryDiagram />',
  },
  {
    name: 'ml-experiments',
    path: './content/docs/foundations/ml/index.mdx',
    moduleId: 'ml-experiments',
    mechanism: 'Pipeline：所有会学习参数的步骤只 Fit Train',
    derivation: 'Precision = TP / (TP + FP)',
    failureTable: '故障诊断表',
    experiment: '故障注入实验',
    canonicalTerm: '<Term id="data-leakage" />',
    component: '<ExperimentSplitDiagram />',
  },
  {
    name: 'data-asset-lifecycle',
    path: './content/docs/foundations/software-systems/data-asset-lifecycle.mdx',
    moduleId: 'data-asset-lifecycle',
    mechanism: '数据资产不是一个文件，而是一张版本化派生图',
    derivation: 'freshnessLag = observedAt - sourceEffectiveAt',
    failureTable: '数据资产故障诊断矩阵',
    experiment: '实验一：更新了文档，但旧Chunk仍在索引',
    canonicalTerm: '<Term id="data-lineage" />',
    component: '<DataAssetLifecycleDiagram />',
  },
  {
    name: 'retrieval-grounding',
    path: './content/docs/foundations/llm/retrieval.mdx',
    moduleId: 'retrieval-grounding',
    mechanism: '离线索引与在线查询是两条流水线',
    derivation: 'Recall@k = |Relevant ∩ Retrieved@k| / |Relevant|',
    failureTable: '故障矩阵',
    experiment: '故障注入实验',
    canonicalTerm: '<Term id="citation" />',
    component: '<RetrievalPipelineDiagram />',
  },
  {
    name: 'model-serving-governance',
    path: './content/docs/foundations/llm/model-serving-governance.mdx',
    moduleId: 'model-serving-governance',
    mechanism: '请求级SLO必须拆成排队、Prefill与Decode',
    derivation: '总延迟 = 排队时间 + Prefill时间 + Decode时间 + 网络输出时间',
    failureTable: '模型服务故障诊断矩阵',
    experiment: '实验一：平均延迟不变，P99排队爆炸',
    canonicalTerm: '<Term id="continuous-batching" />',
    component: '<ModelServingControlDiagram />',
  },
  {
    name: 'workflow-vs-agent',
    path: './content/docs/agent/workflow-vs-agent.mdx',
    moduleId: 'workflow-vs-agent',
    mechanism: '编排模式：不是只有“固定”或“自主”两档',
    derivation: '最坏延迟预算 = 4 × 8 秒 + 3 × 2 秒 = 38 秒',
    failureTable: '故障诊断矩阵',
    experiment: '实验一：路由漂移',
    canonicalTerm: '<Term id="workflow" />',
    component: '<AgentControlLoopDiagram />',
  },
  {
    name: 'agent-state-tools',
    path: './content/docs/agent/state-tools-memory.mdx',
    moduleId: 'agent-state-tools',
    mechanism: 'Action Proposal 与 Executable Command',
    derivation: 'state.step >= state.maxSteps',
    failureTable: '失败诊断矩阵',
    experiment: '故障注入实验',
    canonicalTerm: '<Term id="tool-contract" />',
    component: '<AgentBoundaryDiagram />',
  },
  {
    name: 'safety-evaluation',
    path: './content/docs/safety-evaluation/index.mdx',
    moduleId: 'safety-evaluation',
    mechanism: 'Verdict：Pass、Fail 与 Invalid 分开',
    derivation: 'InvalidRate = invalid runs / all runs',
    failureTable: '故障诊断矩阵',
    experiment: '故障注入实验',
    canonicalTerm: '<Term id="threat-model" />',
    component: '<EvaluationReplayDiagram />',
  },
  {
    name: 'production-capstone',
    path: './content/docs/capstone/index.mdx',
    moduleId: 'production-capstone',
    mechanism: '数据平面与控制平面',
    derivation: '10,000 × (1 - 0.99) = 100',
    failureTable: '端到端故障矩阵',
    experiment: '故障注入实验',
    canonicalTerm: '<Term id="service-level-objective" />',
    component: '<CapstoneSystemDiagram />',
  },
];

describe('core lesson depth contracts', () => {
  for (const contract of coreLessons) {
    it(`${contract.name} contains mechanisms, derivation, failures, experiments and canonical terms`, () => {
      const lesson = readSource(contract.path);

      expect(lesson.length).toBeGreaterThan(12_000);
      expect(lesson).toContain(`moduleId: ${contract.moduleId}`);
      expect(lesson).toContain('estimatedMinutes: 90');
      expect(lesson).toContain('difficulty: core');
      expect(lesson).toContain('<ModuleProgress moduleId="');
      expect(lesson).toContain('<ModulePrerequisites moduleId="');
      expect(lesson).toContain(contract.mechanism);
      expect(lesson).toContain(contract.derivation);
      expect(lesson).toContain(contract.failureTable);
      expect(lesson).toContain(contract.experiment);
      expect(lesson).toContain(contract.canonicalTerm);
      if (contract.component) expect(lesson).toContain(contract.component);
    });
  }

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
});

const directionContracts = [
  ['agent-applications', 'direction-agent-applications'],
  ['agent-runtime-evaluation', 'direction-agent-runtime-evaluation'],
  ['ai-backend-reliability', 'direction-ai-backend-reliability'],
  ['llm-search-retrieval', 'direction-llm-search-retrieval'],
  ['gui-multimodal-agents', 'direction-gui-multimodal-agents'],
  ['game-ai-interactive-narrative', 'direction-game-ai-interactive-narrative'],
  ['edge-inference', 'direction-edge-inference'],
] as const;

describe('direction page contracts', () => {
  for (const [slug, moduleId] of directionContracts) {
    it(`${slug} maps prerequisites, boundaries, evidence and capability gaps`, () => {
      const page = readSource(`./content/docs/directions/${slug}.mdx`);

      expect(page.length).toBeGreaterThan(4_500);
      expect(page).toContain(`moduleId: ${moduleId}`);
      expect(page).toContain('stage: directions');
      expect(page).toContain('estimatedMinutes: 45');
      expect(page).toContain('difficulty: advanced');
      expect(page).toContain(`<ModuleProgress moduleId="${moduleId}" client:load />`);
      expect(page).toContain(`<ModulePrerequisites moduleId="${moduleId}" />`);
      expect(page).toContain('## 这条方向实际解决什么问题');
      expect(page).toContain('## 所需共同前置模块');
      expect(page).toContain('## 典型系统边界');
      expect(page).toContain('## 必会机制');
      expect(page).toContain('## 可验证作品建议');
      expect(page).toContain('## 作品需要留下哪些 Evidence');
      expect(page).toContain('常见“看起来会、实际不会”的缺口');
      expect(page).toContain('## 学习顺序');
      expect(page).toContain('## 抽象岗位能力映射');
    });
  }
});

describe('teaching diagram contracts', () => {
  const diagrams = [
    ['./components/content/EvidenceBundleDiagram.astro', 'evidence-bundle'],
    ['./components/content/StateTransitionDiagram.astro', 'state-transition'],
    ['./components/content/ReliabilityBoundaryDiagram.astro', 'reliability-boundary'],
    ['./components/content/ExperimentSplitDiagram.astro', 'experiment-split'],
    ['./components/content/DataAssetLifecycleDiagram.astro', 'data-asset-lifecycle'],
    ['./components/content/RetrievalPipelineDiagram.astro', 'retrieval-pipeline'],
    ['./components/content/ModelServingControlDiagram.astro', 'model-serving-control'],
    ['./components/content/AgentControlLoopDiagram.astro', 'agent-control-loop'],
    ['./components/content/AgentBoundaryDiagram.astro', 'agent-boundary'],
    ['./components/content/EvaluationReplayDiagram.astro', 'evaluation-replay'],
    ['./components/content/CapstoneSystemDiagram.astro', 'capstone-system'],
  ] as const;

  for (const [path, className] of diagrams) {
    it(`${className} remains semantic, static and mobile-aware`, () => {
      const diagram = readSource(path);
      expect(diagram).toContain('<figure');
      expect(diagram).toContain('<figcaption');
      expect(diagram).not.toContain('client:');
      expect(diagram).not.toContain('<canvas');
      expect(diagram).toContain(`class="${className}`);
      expect(diagram).toContain('@media');
    });
  }

  it('keeps system diagram labels in CSS-sized HTML instead of scaled SVG text', () => {
    const diagram = readSource('./components/content/SystemStackDiagram.astro');

    expect(diagram).not.toContain('<svg');
    expect(diagram).toContain('system-stack__heading');
    expect(diagram).toContain('system-stack__scope');
    expect(diagram).toContain('font-size: 1rem');
  });
});

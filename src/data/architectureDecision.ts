export type ArchitectureKind = 'workflow' | 'agent' | 'hybrid';

export interface ArchitectureRecommendation {
  kind: ArchitectureKind;
  title: string;
  summary: string;
  guardrail: string;
}

export interface DecisionScenario {
  id: string;
  title: string;
  uncertainty: number;
  risk: number;
}

const recommendations: Record<ArchitectureKind, ArchitectureRecommendation> = {
  workflow: {
    kind: 'workflow',
    title: '固定 Workflow',
    summary: '路径已经足够清楚，让代码决定步骤、分支和停止条件。',
    guardrail: '高风险步骤仍需权限检查、确认、幂等和审计。',
  },
  agent: {
    kind: 'agent',
    title: '受控 Agent',
    summary: '路径未知但副作用较低，可以让模型在有限预算内选择下一步。',
    guardrail: '限制工具集合、最大步数、超时和结果验证。',
  },
  hybrid: {
    kind: 'hybrid',
    title: 'Workflow 包围 Agent',
    summary: '模型负责探索，固定 Workflow 负责高风险动作、确认与恢复。',
    guardrail: '把 Agent 放进明确状态机，不让模型直接跨越副作用边界。',
  },
};

export const decisionScenarios: DecisionScenario[] = [
  { id: 'known-pipeline', title: '固定资料处理', uncertainty: 18, risk: 28 },
  { id: 'open-research', title: '开放式资料研究', uncertainty: 82, risk: 24 },
  { id: 'sensitive-action', title: '探索后执行敏感动作', uncertainty: 78, risk: 86 },
];

export function chooseArchitecture(uncertainty: number, risk: number): ArchitectureRecommendation {
  if (uncertainty < 50) return recommendations.workflow;
  if (risk < 60) return recommendations.agent;
  return recommendations.hybrid;
}

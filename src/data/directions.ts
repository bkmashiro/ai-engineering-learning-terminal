import type { DirectionId } from './roadmap';

export interface CareerDirection {
  id: DirectionId;
  title: string;
  summary: string;
  dailyWork: string[];
  evidence: string;
}

export const careerDirections: CareerDirection[] = [
  {
    id: 'agent-applications',
    title: 'Agent 应用与产品工程',
    summary: '把模型、工具和状态做成用户可理解、失败可恢复的产品。',
    dailyWork: ['交互状态', '记忆与反馈', '流式体验', '人工接管'],
    evidence: '一个有真实失败恢复路径的 Agent 应用',
  },
  {
    id: 'agent-runtime-evaluation',
    title: 'Agent Runtime、Harness 与评测',
    summary: '构建可运行、可追踪、可回放和可比较的执行环境。',
    dailyWork: ['工具协议', 'trace/replay', '故障注入', '评测数据集'],
    evidence: '一个能回放失败并生成报告的 Harness',
  },
  {
    id: 'ai-backend-reliability',
    title: 'AI 后端与可靠性工程',
    summary: '保证流式 API、队列、状态和成本在故障下仍可控制。',
    dailyWork: ['并发与取消', '幂等与事务', '可观测性', '容量与成本'],
    evidence: '一个能处理断线、重复请求和 worker 失败的服务骨架',
  },
  {
    id: 'llm-search-retrieval',
    title: 'LLM、搜索与检索工程',
    summary: '围绕数据、召回、排序、grounding 和评测提升答案质量。',
    dailyWork: ['数据构建', '混合检索', '重排', '离线/在线评测'],
    evidence: '一个有可解释召回和无答案处理的检索系统',
  },
  {
    id: 'gui-multimodal-agents',
    title: 'GUI、OS 与多模态 Agent',
    summary: '让 Agent 理解界面状态，并安全执行可验证、可恢复的动作。',
    dailyWork: ['视觉/DOM grounding', '动作空间', '权限', '回滚与验证'],
    evidence: '一个在模拟界面上执行并验证动作的 Lab',
  },
  {
    id: 'game-ai-interactive-narrative',
    title: '游戏 AI 与交互式叙事',
    summary: '把传统游戏系统、规划、记忆和生成模型组合起来。',
    dailyWork: ['NPC 状态', '行为与规划', '玩家体验', '内容边界'],
    evidence: '一个能解释状态、计划、记忆和 fallback 的 NPC 系统',
  },
  {
    id: 'edge-inference',
    title: '端侧与推理工程',
    summary: '在设备约束下平衡模型质量、延迟、内存和功耗。',
    dailyWork: ['模型转换', '量化', '性能测量', '运行时集成'],
    evidence: '一个包含误差、延迟和内存对比的端侧实验',
  },
];

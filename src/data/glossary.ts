export interface GlossaryEntry {
  term: string;
  english: string;
  definition: string;
}

export const glossary: GlossaryEntry[] = [
  { term: '工作流', english: 'workflow', definition: '由代码预先决定步骤和分支的执行路径。' },
  { term: '智能体', english: 'agent', definition: '在受控边界内由模型选择下一步动作的系统。' },
  { term: '工具调用', english: 'tool calling', definition: '模型提出结构化动作，由程序验证并执行。' },
  { term: '检索增强生成', english: 'retrieval-augmented generation, RAG', definition: '先检索外部材料，再将相关上下文交给模型生成。' },
  { term: '服务端事件流', english: 'Server-Sent Events, SSE', definition: '服务器向浏览器单向持续推送文本事件的 HTTP 机制。' },
  { term: '幂等', english: 'idempotency', definition: '同一请求重复执行不会产生额外副作用。' },
  { term: '回放', english: 'replay', definition: '使用记录的输入、状态和事件重新执行或检查一次任务。' },
  { term: '追踪', english: 'trace', definition: '跨步骤记录一次任务的时间、状态、调用和结果。' },
];

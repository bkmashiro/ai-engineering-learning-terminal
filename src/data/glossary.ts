export interface GlossaryEntry {
  id: string;
  term: string;
  english: string;
  definition: string;
  relatedModuleIds: readonly string[];
}

export const glossary = [
  { id: 'workflow', term: '工作流', english: 'Workflow', definition: '由代码预先决定步骤、分支和停止条件的执行路径。', relatedModuleIds: ['workflow-vs-agent'] },
  { id: 'agent', term: '智能体', english: 'Agent', definition: '在程序边界内，由模型根据当前状态选择下一步动作的系统。', relatedModuleIds: ['workflow-vs-agent'] },
  { id: 'tool-calling', term: '工具调用', english: 'Tool Calling', definition: '模型提出结构化动作，程序完成校验、授权和实际执行。', relatedModuleIds: ['workflow-vs-agent'] },
  { id: 'state-machine', term: '状态机', english: 'State Machine', definition: '用有限状态和明确转换规则描述系统如何变化。', relatedModuleIds: ['state-events', 'workflow-vs-agent'] },
  { id: 'structured-output', term: '结构化输出', english: 'Structured Output', definition: '让模型按可解析、可验证的数据结构返回结果，而不是只给自然语言。', relatedModuleIds: ['llm-foundations', 'workflow-vs-agent'] },
  { id: 'schema', term: '模式约束', english: 'Schema', definition: '对数据字段、类型、必填项和取值范围的机器可检查约束。', relatedModuleIds: ['workflow-vs-agent'] },
  { id: 'retrieval-augmented-generation', term: '检索增强生成', english: 'Retrieval-Augmented Generation, RAG', definition: '先检索外部材料，再把相关证据放进模型上下文中生成答案。', relatedModuleIds: ['retrieval-grounding'] },
  { id: 'server-sent-events', term: '服务端事件流', english: 'Server-Sent Events, SSE', definition: '服务器通过一个持续的 HTTP 连接向浏览器单向发送文本事件。', relatedModuleIds: ['network-streaming'] },
  { id: 'backpressure', term: '背压', english: 'Backpressure', definition: '下游处理不过来时，限制上游继续生产数据的流量控制机制。', relatedModuleIds: ['network-streaming'] },
  { id: 'timeout', term: '超时', english: 'Timeout', definition: '操作超过明确期限后主动停止等待，并进入可分类的失败路径。', relatedModuleIds: ['network-streaming', 'workflow-vs-agent'] },
  { id: 'cancellation', term: '取消', english: 'Cancellation', definition: '调用方明确通知正在执行的工作尽快停止，并释放相关资源。', relatedModuleIds: ['network-streaming', 'workflow-vs-agent'] },
  { id: 'deadline', term: '截止时刻', english: 'Deadline', definition: '一个绝对时间点；到达后，整条调用链都不应再为本次操作启动新工作。', relatedModuleIds: ['network-streaming'] },
  { id: 'retry', term: '重试', english: 'Retry', definition: '在可分类的临时失败后再次尝试；是否安全取决于副作用、幂等性和剩余时间。', relatedModuleIds: ['network-streaming', 'workflow-vs-agent'] },
  { id: 'event-id', term: '事件标识', english: 'Event ID', definition: '标识事件在一个有序事件流中的位置，用于断线续传、去重和回放。', relatedModuleIds: ['network-streaming'] },
  { id: 'idempotency', term: '幂等', english: 'Idempotency', definition: '同一个请求重复执行时，不会额外产生新的副作用。', relatedModuleIds: ['data-reliability', 'workflow-vs-agent'] },
  { id: 'token', term: '词元', english: 'Token', definition: '模型处理文本时使用的离散单位；它不一定等于一个字或一个单词。', relatedModuleIds: ['llm-foundations'] },
  { id: 'embedding', term: '嵌入表示', english: 'Embedding', definition: '把离散Token映射成连续向量，使后续层能通过可学习的数值运算处理它。', relatedModuleIds: ['llm-foundations', 'retrieval-grounding'] },
  { id: 'attention', term: '注意力', english: 'Attention', definition: '模型在计算当前表示时，对上下文中不同位置分配关联权重的机制。', relatedModuleIds: ['llm-foundations'] },
  { id: 'query-key-value', term: '查询、键和值', english: 'Query, Key, Value (Q/K/V)', definition: '由输入表示经过不同线性投影得到的三组向量：Q与K计算权重，权重再组合V。', relatedModuleIds: ['llm-foundations'] },
  { id: 'causal-mask', term: '因果掩码', english: 'Causal Mask', definition: '在自回归生成中屏蔽当前位置之后的Token，防止预测时读取未来答案。', relatedModuleIds: ['llm-foundations'] },
  { id: 'multi-head-attention', term: '多头注意力', english: 'Multi-Head Attention', definition: '用多组独立投影并行计算注意力，再拼接和投影回模型维度。', relatedModuleIds: ['llm-foundations'] },
  { id: 'positional-representation', term: '位置表示', english: 'Positional Representation', definition: '向Token表示加入顺序或相对距离信息，因为单独的注意力运算并不知道输入排列。', relatedModuleIds: ['llm-foundations'] },
  { id: 'context-window', term: '上下文窗口', english: 'Context Window', definition: '一次推理中模型能够读取和生成的 Token 总预算。', relatedModuleIds: ['llm-foundations'] },
  { id: 'prefill-decode', term: '预填充与解码', english: 'Prefill and Decode', definition: '推理的两个阶段：先并行处理已有输入，再逐Token生成后续输出。', relatedModuleIds: ['llm-foundations'] },
  { id: 'kv-cache', term: '键值缓存', english: 'KV Cache', definition: '自回归解码时保存历史Token各层的K/V，避免每生成一步都重复计算整段前缀。', relatedModuleIds: ['llm-foundations'] },
  { id: 'replay', term: '回放', english: 'Replay', definition: '用记录的输入、状态和事件重新执行或检查一次任务。', relatedModuleIds: ['evidence-first', 'safety-evaluation'] },
  { id: 'trace', term: '追踪记录', english: 'Trace', definition: '跨步骤记录一次任务的时间、公开状态、调用和结果。', relatedModuleIds: ['evidence-first', 'workflow-vs-agent'] },
] as const satisfies readonly GlossaryEntry[];

export type GlossaryId = (typeof glossary)[number]['id'];

export function getGlossaryEntry(id: GlossaryId): (typeof glossary)[number] {
  const entry = glossary.find((item) => item.id === id);
  if (!entry) throw new Error(`Unknown glossary entry: ${id}`);
  return entry;
}

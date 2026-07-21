import { useMemo, useState } from 'preact/hooks';
import './AgentLoopStepper.css';

type Scenario = 'normal' | 'timeout' | 'invalid-schema' | 'repeated-state';

interface Step {
  id: string;
  shortLabel: string;
  label: string;
  description: string;
  output: string;
  x: number;
  y: number;
}

const steps: Step[] = [
  {
    id: 'observe',
    shortLabel: '观察',
    label: '观察输入',
    description: '读取用户目标、当前状态和可用工具。',
    output: '结构化任务 + 状态快照',
    x: 95,
    y: 105,
  },
  {
    id: 'decide',
    shortLabel: '选择',
    label: '选择动作',
    description: '模型只选择下一项公开动作，不直接执行副作用。',
    output: '动作名称 + 参数草案',
    x: 300,
    y: 65,
  },
  {
    id: 'act',
    shortLabel: '工具',
    label: '执行工具',
    description: '程序先验证 Schema、权限和超时，再调用工具。',
    output: '工具结果或分类错误',
    x: 510,
    y: 105,
  },
  {
    id: 'validate',
    shortLabel: '验证',
    label: '验证结果',
    description: '检查结果是否满足契约，是否需要重试或人工确认。',
    output: '接受、重试、降级或停止',
    x: 510,
    y: 280,
  },
  {
    id: 'update',
    shortLabel: '更新',
    label: '更新状态',
    description: '记录 trace，更新有限状态，并判断是否终止。',
    output: '新状态 + 终止条件',
    x: 300,
    y: 325,
  },
];

const edgePaths = [
  'M145 105 C195 105 210 65 248 65',
  'M352 65 C405 65 420 105 458 105',
  'M510 135 L510 250',
  'M458 280 C410 280 402 325 352 325',
  'M248 325 C160 325 95 245 95 135',
];

const scenarioLabels: Record<Scenario, string> = {
  normal: '正常路径',
  timeout: '工具超时',
  'invalid-schema': '结果不符合 Schema',
  'repeated-state': '状态重复，可能循环',
};

const faults: Partial<Record<Scenario, { at: number; message: string; recovery: string }>> = {
  timeout: {
    at: 2,
    message: '工具超时：执行没有在期限内完成。',
    recovery: '停止当前调用；根据幂等性决定是否重试，并把超时写入 trace。',
  },
  'invalid-schema': {
    at: 3,
    message: 'Schema 验证失败：结果不能进入后续状态。',
    recovery: '保留原状态，返回结构化错误；可选择修复参数或使用 fallback。',
  },
  'repeated-state': {
    at: 4,
    message: '检测到重复状态：继续执行可能形成循环。',
    recovery: '触发循环保护，停止执行并交给人工或更保守的工作流。',
  },
};

function AgentLoopDiagram({ current, trace, fault }: { current: number; trace: number[]; fault: string | null }) {
  const currentStep = steps[current];
  const recoveryPath = `M${currentStep.x} ${currentStep.y + 30} C${currentStep.x} 360 396 380 380 398`;

  return (
    <div class="loop-lab__diagram">
      <svg viewBox="0 0 620 440" role="img" aria-label="Agent Loop 状态图">
        <defs>
          <marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="loop-lab__arrowhead" />
          </marker>
          <pattern id="loop-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" class="loop-lab__grid-line" fill="none" />
          </pattern>
          <filter id="loop-glow" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodOpacity="0.28" />
          </filter>
        </defs>

        <rect x="1" y="1" width="618" height="438" rx="18" fill="url(#loop-grid)" class="loop-lab__canvas" />

        <g class="loop-lab__boundary">
          <rect x="434" y="45" width="152" height="285" rx="18" />
          <text x="510" y="27" textAnchor="middle">权限 · SCHEMA · 超时</text>
        </g>

        <path d="M15 105 H43" class="loop-lab__edge is-input" markerEnd="url(#loop-arrow)" />
        {edgePaths.map((path, index) => (
          <path
            d={path}
            class={[
              'loop-lab__edge',
              trace.includes(index + 1) || (index === 4 && trace.includes(4)) ? 'is-visited' : '',
              current === index + 1 ? 'is-active' : '',
            ].filter(Boolean).join(' ')}
            markerEnd="url(#loop-arrow)"
          />
        ))}

        <g class="loop-lab__state-store">
          <circle cx="300" cy="198" r="56" />
          <circle cx="300" cy="198" r="42" />
          <path d="M300 142 V95 M300 254 V294" />
          <text x="300" y="194" textAnchor="middle">STATE</text>
          <text x="300" y="214" textAnchor="middle">公开状态</text>
        </g>

        <text x="15" y="88" class="loop-lab__io-label">INPUT</text>
        <text x="111" y="214" class="loop-lab__loop-label">状态改变后再观察</text>

        {steps.map((step, index) => {
          const state = fault && index === current
            ? 'fault'
            : index === current
              ? 'active'
              : trace.includes(index)
                ? 'visited'
                : 'idle';
          return (
            <g
              class={`loop-lab__node is-${state}`}
              transform={`translate(${step.x - 52} ${step.y - 30})`}
              aria-current={index === current ? 'step' : undefined}
              data-state={state}
              data-testid={`loop-node-${step.id}`}
            >
              {index === current ? <circle cx="52" cy="30" r="38" class="loop-lab__node-pulse" /> : null}
              <rect width="104" height="60" rx="14" filter={index === current ? 'url(#loop-glow)' : undefined} />
              <circle cx="24" cy="30" r="13" class="loop-lab__node-index" />
              <text x="24" y="35" textAnchor="middle" class="loop-lab__node-number">{index + 1}</text>
              <text x="45" y="36" class="loop-lab__node-label">{step.shortLabel}</text>
              {state === 'fault' ? (
                <g class="loop-lab__fault-mark" transform="translate(88 14)">
                  <circle r="10" />
                  <path d="M-4-4 L4 4 M4-4 L-4 4" />
                </g>
              ) : null}
            </g>
          );
        })}

        {fault ? (
          <g class="loop-lab__recovery-route" data-testid="recovery-card">
            <path d={recoveryPath} markerEnd="url(#loop-arrow)" />
            <rect x="380" y="369" width="208" height="56" rx="12" />
            <text x="484" y="392" textAnchor="middle">STOP · RECOVER</text>
            <text x="484" y="411" textAnchor="middle" class="loop-lab__recovery-subtitle">停止 · 恢复 · 复核</text>
          </g>
        ) : (
          <g class="loop-lab__success-route">
            <path d="M352 325 C410 340 430 352 455 370" markerEnd="url(#loop-arrow)" />
            <text x="465" y="389">完成后输出</text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function AgentLoopStepper() {
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [current, setCurrent] = useState(0);
  const [trace, setTrace] = useState<number[]>([0]);
  const [fault, setFault] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const faultDefinition = faults[scenario];
  const currentStep = steps[current];
  const statusText = useMemo(() => {
    if (fault) return `已停止：${fault}`;
    if (complete) return '已完成：达到终止条件，返回结果。';
    return `当前步骤：${currentStep.label}`;
  }, [complete, currentStep.label, fault]);

  const reset = (nextScenario = scenario) => {
    setScenario(nextScenario);
    setCurrent(0);
    setTrace([0]);
    setFault(null);
    setComplete(false);
  };

  const advance = () => {
    if (fault || complete) return;
    const next = current + 1;
    if (next >= steps.length) {
      setComplete(true);
      return;
    }

    setCurrent(next);
    setTrace((items) => [...items, next]);
    if (faultDefinition?.at === next) {
      setFault(faultDefinition.message);
      return;
    }
    if (next === steps.length - 1) setComplete(true);
  };

  return (
    <section class="loop-lab" aria-labelledby="loop-lab-title">
      <div class="loop-lab__header">
        <div>
          <p class="loop-lab__eyebrow">交互实验 · 确定性模拟</p>
          <h2 id="loop-lab-title">Agent Loop 故障注入</h2>
          <p>沿图逐步执行；一旦越过安全边界，路径会转入停止与恢复。</p>
        </div>
        <label class="loop-lab__scenario">
          <span>故障场景</span>
          <select
            value={scenario}
            onChange={(event) => reset((event.currentTarget as HTMLSelectElement).value as Scenario)}
          >
            {Object.entries(scenarioLabels).map(([value, label]) => (
              <option value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <AgentLoopDiagram current={current} trace={trace} fault={fault} />

      <div class="loop-lab__panel">
        <div>
          <p class="loop-lab__counter">STEP {current + 1} / {steps.length}</p>
          <h3>{currentStep.label}</h3>
          <p>{currentStep.description}</p>
        </div>
        <div class="loop-lab__output">
          <span>公开输出</span>
          <strong>{currentStep.output}</strong>
        </div>
      </div>

      <p class={fault ? 'loop-lab__status is-error' : 'loop-lab__status'} role="status" aria-live="polite">
        {statusText}
      </p>

      {fault && faultDefinition ? (
        <p class="loop-lab__recovery"><strong>恢复策略：</strong>{faultDefinition.recovery}</p>
      ) : null}

      <div class="loop-lab__actions">
        <button type="button" class="loop-lab__button is-primary" onClick={advance} disabled={Boolean(fault) || complete}>
          下一步
        </button>
        <button type="button" class="loop-lab__button" onClick={() => reset()}>
          重新开始
        </button>
      </div>
    </section>
  );
}

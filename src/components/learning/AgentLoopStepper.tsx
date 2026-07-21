import { useMemo, useState } from 'preact/hooks';
import './AgentLoopStepper.css';

type Scenario = 'normal' | 'timeout' | 'invalid-schema' | 'repeated-state';

interface Step {
  id: string;
  label: string;
  description: string;
  output: string;
}

const steps: Step[] = [
  {
    id: 'observe',
    label: '观察输入',
    description: '读取用户目标、当前状态和可用工具。',
    output: '结构化任务 + 状态快照',
  },
  {
    id: 'decide',
    label: '选择动作',
    description: '模型只选择下一项公开动作，不直接执行副作用。',
    output: '动作名称 + 参数草案',
  },
  {
    id: 'act',
    label: '执行工具',
    description: '程序先验证 Schema、权限和超时，再调用工具。',
    output: '工具结果或分类错误',
  },
  {
    id: 'validate',
    label: '验证结果',
    description: '检查结果是否满足契约，是否需要重试或人工确认。',
    output: '接受、重试、降级或停止',
  },
  {
    id: 'update',
    label: '更新状态',
    description: '记录 trace，更新有限状态，并判断是否终止。',
    output: '新状态 + 终止条件',
  },
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
          <p>切换场景并逐步执行，观察程序应在哪里停止，而不是让模型无限继续。</p>
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

      <ol class="loop-lab__steps" aria-label="Agent Loop 步骤">
        {steps.map((step, index) => (
          <li
            class={[
              'loop-lab__step',
              index === current ? 'is-current' : '',
              trace.includes(index) ? 'is-visited' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={index === current ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            {step.label}
          </li>
        ))}
      </ol>

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

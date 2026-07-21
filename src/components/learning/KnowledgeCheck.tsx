import { useState } from 'preact/hooks';
import './KnowledgeCheck.css';

const options = [
  '步骤清楚、边界固定，而且每一步都必须可审计',
  '目标开放，必须由模型探索未知步骤',
  '需要多个 Agent 自由协商才能知道任务是什么',
];

export function KnowledgeCheck() {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === 0;

  const reset = () => {
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <section class="knowledge-check" aria-labelledby="knowledge-check-title">
      <p class="knowledge-check__eyebrow">CHECK YOUR MODEL</p>
      <h2 id="knowledge-check-title">哪种任务更适合固定 Workflow？</h2>
      <fieldset disabled={submitted}>
        <legend class="sr-only">选择最适合固定 Workflow 的任务</legend>
        {options.map((option, index) => (
          <label>
            <input
              type="radio"
              name="workflow-question"
              checked={selected === index}
              onChange={() => setSelected(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <div class="knowledge-check__actions">
        <button type="button" onClick={() => setSubmitted(true)} disabled={selected === null || submitted}>
          查看解释
        </button>
        {submitted ? <button type="button" class="is-secondary" onClick={reset}>再想一次</button> : null}
      </div>
      {submitted ? (
        <p class={correct ? 'knowledge-check__feedback is-correct' : 'knowledge-check__feedback'} role="status">
          <strong>{correct ? '正确。' : '再检查一下。'}</strong>{' '}
          当步骤和合规边界已知时，固定 Workflow 更容易测试、审计和恢复。Agent 的价值在于受控地处理未知路径，而不是替代所有普通程序。
        </p>
      ) : null}
    </section>
  );
}

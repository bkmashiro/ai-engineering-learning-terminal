import { useMemo, useState } from 'preact/hooks';
import {
  chooseArchitecture,
  decisionScenarios,
  type DecisionScenario,
} from '../../data/architectureDecision';
import './ArchitectureDecisionMap.css';

const plot = { left: 72, top: 38, width: 500, height: 292 };

function pointFor(uncertainty: number, risk: number) {
  return {
    x: plot.left + (uncertainty / 100) * plot.width,
    y: plot.top + ((100 - risk) / 100) * plot.height,
  };
}

export function ArchitectureDecisionMap() {
  const [uncertainty, setUncertainty] = useState(28);
  const [risk, setRisk] = useState(28);
  const recommendation = useMemo(() => chooseArchitecture(uncertainty, risk), [risk, uncertainty]);
  const point = pointFor(uncertainty, risk);

  const useScenario = (scenario: DecisionScenario) => {
    setUncertainty(scenario.uncertainty);
    setRisk(scenario.risk);
  };

  return (
    <section class="decision-map" aria-labelledby="decision-map-title">
      <div class="decision-map__header">
        <div>
          <p class="decision-map__eyebrow">ARCHITECTURE COMPASS</p>
          <h2 id="decision-map-title">任务应该落在哪种架构里？</h2>
          <p>沿两条轴移动任务：路径越未知，越需要模型决策；副作用越高，越需要固定流程包围。</p>
        </div>
        <div class={`decision-map__badge is-${recommendation.kind}`}>{recommendation.title}</div>
      </div>

      <div class="decision-map__visual">
        <svg viewBox="0 0 640 388" role="img" aria-labelledby="decision-chart-title decision-chart-desc">
          <title id="decision-chart-title">任务不确定性与副作用风险架构选择图</title>
          <desc id="decision-chart-desc">横轴是路径不确定性，纵轴是副作用风险。当前点位于{recommendation.title}区域。</desc>
          <defs>
            <pattern id="decision-grid" width="25" height="24.3" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 24.3" class="decision-map__grid-line" fill="none" />
            </pattern>
            <filter id="decision-shadow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.2" />
            </filter>
          </defs>

          <rect x="72" y="38" width="250" height="292" rx="14" class="decision-map__zone is-workflow" />
          <rect x="322" y="38" width="250" height="117" rx="14" class="decision-map__zone is-hybrid" />
          <rect x="322" y="155" width="250" height="175" rx="14" class="decision-map__zone is-agent" />
          <rect x="72" y="38" width="500" height="292" rx="14" fill="url(#decision-grid)" class="decision-map__plot-border" />

          <g class="decision-map__zone-label">
            <text x="92" y="67">固定 WORKFLOW</text>
            <text x="342" y="67">WORKFLOW 包围 AGENT</text>
            <text x="342" y="184">受控 AGENT</text>
          </g>

          <line x1="72" y1={point.y} x2={point.x} y2={point.y} class="decision-map__crosshair" />
          <line x1={point.x} y1={point.y} x2={point.x} y2="330" class="decision-map__crosshair" />
          <circle cx={point.x} cy={point.y} r="17" class={`decision-map__pulse is-${recommendation.kind}`} />
          <circle cx={point.x} cy={point.y} r="8" class={`decision-map__point is-${recommendation.kind}`} filter="url(#decision-shadow)" />

          <g class="decision-map__axis-labels">
            <text x="72" y="361">路径明确</text>
            <text x="572" y="361" text-anchor="end">路径未知</text>
            <text x="322" y="381" text-anchor="middle">路径不确定性 →</text>
            <text x="20" y="184" text-anchor="middle" transform="rotate(-90 20 184)">副作用风险 →</text>
            <text x="54" y="325" text-anchor="end">低</text>
            <text x="54" y="49" text-anchor="end">高</text>
          </g>
        </svg>
      </div>

      <div class="decision-map__controls">
        <label>
          <span><strong>路径不确定性</strong><span class="decision-map__value">{uncertainty}</span></span>
          <input
            aria-label="路径不确定性"
            type="range"
            min="0"
            max="100"
            value={uncertainty}
            onInput={(event) => setUncertainty(Number(event.currentTarget.value))}
          />
        </label>
        <label>
          <span><strong>副作用风险</strong><span class="decision-map__value">{risk}</span></span>
          <input
            aria-label="副作用风险"
            type="range"
            min="0"
            max="100"
            value={risk}
            onInput={(event) => setRisk(Number(event.currentTarget.value))}
          />
        </label>
      </div>

      <div class="decision-map__presets" aria-label="示例任务">
        {decisionScenarios.map((scenario) => (
          <button type="button" onClick={() => useScenario(scenario)}>
            {scenario.title}
          </button>
        ))}
      </div>

      <div class={`decision-map__result is-${recommendation.kind}`} role="status" aria-live="polite">
        <div>
          <span>当前建议</span>
          <strong>{recommendation.title}</strong>
        </div>
        <p>{recommendation.summary}</p>
        <small>{recommendation.guardrail}</small>
      </div>
    </section>
  );
}

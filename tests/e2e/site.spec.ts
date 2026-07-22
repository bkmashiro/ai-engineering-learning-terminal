import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('homepage exposes the learning route and keeps the page readable', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/AI 工程学习终端/);
  await expect(page.getByRole('heading', { name: '先建立共同底座，再选择方向。' })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看完整路线' })).toHaveAttribute('href', '/roadmap/');
  await expect(page.getByRole('link', { name: '开始第一课' })).toHaveAttribute('href', '/agent/workflow-vs-agent/');

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);

  const stageHeights = await page.locator('.stage-card').evaluateAll((cards) =>
    cards.map((card) => card.getBoundingClientRect().height),
  );
  expect(Math.max(...stageHeights) - Math.min(...stageHeights)).toBeLessThan(1);

  await expect(page.locator('.system-stack svg')).toHaveCount(0);
  const scopeFontSize = await page.locator('.system-stack__scope').first().evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).fontSize),
  );
  expect(scopeFontSize).toBeGreaterThanOrEqual(14);
});

test('roadmap filters without losing the selected direction prerequisites', async ({ page }) => {
  await page.goto('/roadmap/');

  await page.getByLabel('查看路径').selectOption('agent-runtime-evaluation');
  await expect(page.locator('.roadmap__node').filter({ hasText: 'Workflow 与 Agent' })).toBeVisible();
  await expect(page.locator('.roadmap__node').filter({ hasText: 'Agent Runtime、Harness 与评测' })).toBeVisible();
});

test('agent lab reports a timeout and stops advancing', async ({ page }) => {
  await page.goto('/agent/workflow-vs-agent/');

  await page.getByLabel('故障场景').selectOption('timeout');
  await page.getByRole('button', { name: '下一步' }).click();
  await expect(page.getByRole('heading', { name: '选择动作' })).toBeVisible();
  await page.getByRole('button', { name: '下一步' }).click();

  await expect(page.locator('.loop-lab__status')).toContainText('工具超时');
  await expect(page.getByTestId('recovery-card')).toContainText('STOP · RECOVER');
  await expect(page.getByTestId('recovery-card')).toContainText('停止 · 恢复 · 复核');
  await expect(page.getByRole('button', { name: '下一步' })).toBeDisabled();
});

test('foundation lessons render the mechanism and recovery sections', async ({ page }) => {
  await page.goto('/foundations/software-systems/network-streaming/');
  await expect(page.getByRole('heading', { name: 'SSE不是“不断返回一点字符串”' })).toBeVisible();
  await expect(page.getByText('Last-Event-ID', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '故障诊断表' })).toBeVisible();

  await page.goto('/foundations/llm/');
  await expect(page.getByRole('heading', { name: '缩放点积Attention逐步计算' })).toBeVisible();
  await expect(page.locator('.attention-mechanism')).toContainText('Q=XW_Q · K=XW_K · V=XW_V');
  await expect(page.getByRole('heading', { name: 'Attention权重不是解释' })).toBeVisible();
});

test('lesson keeps progress locally and exposes canonical prerequisite links', async ({ page }) => {
  await page.goto('/agent/workflow-vs-agent/');

  await expect(page.locator('.module-prerequisites').getByRole('link', { name: /网络、流式与取消/ })).toHaveAttribute(
    'href',
    '/foundations/software-systems/network-streaming/',
  );
  await page.getByRole('button', { name: '标记本课完成' }).click();
  await page.reload();
  await expect(page.locator('.module-progress').getByRole('status')).toContainText('本课已完成');
});

test('architecture map and terminology peeks are directly explorable', async ({ page }) => {
  await page.goto('/agent/workflow-vs-agent/');

  await page.getByRole('button', { name: '探索后执行敏感动作' }).click();
  await expect(page.locator('.decision-map__result')).toContainText('Workflow 包围 Agent');

  const firstTerm = page.locator('.term-peek').first();
  await expect(firstTerm.locator('.term-peek__panel')).toBeHidden();
  await firstTerm.locator('dfn').focus();
  await expect(firstTerm.locator('.term-peek__panel')).toBeVisible();
  await expect(firstTerm.locator('.term-peek__panel')).toContainText('打开术语条目');
});

test('core pages have no automatic WCAG A/AA violations', async ({ page }) => {
  for (const path of [
    '/',
    '/roadmap/',
    '/foundations/reproducibility/',
    '/foundations/software-systems/state-and-events/',
    '/foundations/software-systems/network-streaming/',
    '/foundations/software-systems/data-reliability/',
    '/foundations/ml/',
    '/foundations/llm/',
    '/foundations/llm/retrieval/',
    '/agent/workflow-vs-agent/',
    '/agent/state-tools-memory/',
    '/safety-evaluation/',
    '/capstone/',
    '/directions/',
    '/directions/agent-applications/',
    '/directions/agent-runtime-evaluation/',
    '/directions/ai-backend-reliability/',
    '/directions/llm-search-retrieval/',
    '/directions/gui-multimodal-agents/',
    '/directions/game-ai-interactive-narrative/',
    '/directions/edge-inference/',
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, `${path}: ${results.violations.map((item) => item.id).join(', ')}`).toEqual([]);
  }
});

test('new core modules expose mechanisms, diagrams and mobile-safe layouts', async ({ page }) => {
  const modules = [
    {
      path: '/foundations/reproducibility/',
      heading: 'Structured Result：成功和失败必须是不同数据形状',
      component: '.evidence-bundle',
      hasPrerequisites: false,
    },
    {
      path: '/foundations/software-systems/state-and-events/',
      heading: '状态转换函数：保持纯函数边界',
      component: '.state-transition',
    },
    {
      path: '/foundations/software-systems/data-reliability/',
      heading: 'Transactional Outbox：让数据库状态与待发布事件一起提交',
      component: '.reliability-boundary',
    },
    {
      path: '/foundations/ml/',
      heading: '混淆矩阵与手算',
      component: '.experiment-split',
    },
    {
      path: '/foundations/llm/retrieval/',
      heading: 'Citation 与 Grounding',
      component: '.retrieval-pipeline',
    },
    {
      path: '/agent/state-tools-memory/',
      heading: 'Runner 状态机',
      component: '.agent-boundary',
    },
    {
      path: '/safety-evaluation/',
      heading: 'Verdict：Pass、Fail 与 Invalid 分开',
      component: '.evaluation-replay',
    },
    {
      path: '/capstone/',
      heading: '质量、延迟、成本与可靠性预算',
      component: '.capstone-system',
    },
  ];

  await page.setViewportSize({ width: 360, height: 800 });
  for (const module of modules) {
    await page.goto(module.path);
    await expect(page.getByRole('heading', { name: module.heading })).toBeVisible();
    await expect(page.locator(module.component)).toBeVisible();
    await expect(page.locator('.module-progress')).toBeVisible();
    const tableTabIndexes = await page.locator('table').evaluateAll((tables) => tables.map((table) => table.tabIndex));
    expect(tableTabIndexes.every((tabIndex) => tabIndex === 0), module.path).toBe(true);
    if (module.hasPrerequisites !== false) {
      await expect(page.locator('.module-prerequisites')).toBeVisible();
    } else {
      await expect(page.locator('.module-prerequisites')).toHaveCount(0);
    }

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document, module.path).toBeLessThanOrEqual(widths.viewport + 1);
  }
});

test('direction pages expose system boundaries, evidence and learning order', async ({ page }) => {
  const paths = [
    '/directions/agent-applications/',
    '/directions/agent-runtime-evaluation/',
    '/directions/ai-backend-reliability/',
    '/directions/llm-search-retrieval/',
    '/directions/gui-multimodal-agents/',
    '/directions/game-ai-interactive-narrative/',
    '/directions/edge-inference/',
  ];

  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of paths) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: '这条方向实际解决什么问题', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '可验证作品建议', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '作品需要留下哪些 Evidence', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '学习顺序', exact: true })).toBeVisible();
    await expect(page.locator('.module-progress')).toBeVisible();
    await expect(page.locator('.module-prerequisites')).toBeVisible();

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document, path).toBeLessThanOrEqual(widths.viewport + 1);
  }
});

test('new course prerequisites resolve through canonical roadmap links', async ({ page }) => {
  await page.goto('/foundations/software-systems/state-and-events/');
  await expect(page.locator('.module-prerequisites').getByRole('link', { name: /可复现与证据/ })).toHaveAttribute(
    'href',
    '/foundations/reproducibility/',
  );

  await page.goto('/foundations/llm/retrieval/');
  await expect(page.locator('.module-prerequisites').getByRole('link', { name: /Token、Attention 与上下文/ })).toHaveAttribute(
    'href',
    '/foundations/llm/',
  );
  await expect(page.locator('.module-prerequisites').getByRole('link', { name: /事务、缓存与队列/ })).toHaveAttribute(
    'href',
    '/foundations/software-systems/data-reliability/',
  );
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('homepage exposes the learning route and keeps the page readable', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/AI 工程学习终端/);
  await expect(page.getByRole('heading', { name: '先建立共同底座，再选择方向。' })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看完整路线' })).toHaveAttribute('href', '/roadmap/');
  await expect(page.getByRole('link', { name: '从第一课开始' })).toHaveAttribute('href', '/foundations/reproducibility/');
  await expect(page.getByRole('link', { name: '在 GitHub 查看课程仓库' })).toHaveAttribute(
    'href',
    'https://github.com/bkmashiro/ai-engineering-learning-terminal',
  );
  await expect(page.getByRole('heading', { name: '课程覆盖' })).toBeVisible();
  await expect(page.getByText('第一版已经可以学什么？')).toHaveCount(0);

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

test('sidebar separates learning directions from site references', async ({ page }, testInfo) => {
  await page.goto('/glossary/');
  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: '菜单', exact: true }).click();
  }
  const sidebar = page.locator('#starlight__sidebar');
  await expect(sidebar.getByText('方向', { exact: true })).toBeVisible();
  const directionGroup = sidebar.locator('summary').filter({ hasText: /^方向$/ }).locator('..');
  await expect(directionGroup).not.toHaveAttribute('open', '');
  await expect(sidebar.getByText('参考与本站', { exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: '术语表', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: '来源', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: '关于本站', exact: true })).toBeVisible();

  await page.goto('/directions/agent-applications/');
  const activeDirectionGroup = page
    .locator('#starlight__sidebar summary')
    .filter({ hasText: /^方向$/ })
    .locator('..');
  await expect(activeDirectionGroup).toHaveAttribute('open', '');
});

test('sidebar navigation swaps pages without reloading the document', async ({ page }, testInfo) => {
  await page.goto('/agent/workflow-vs-agent/');
  const sentinel = await page.evaluate(() => {
    const value = crypto.randomUUID();
    (window as Window & { __navigationSentinel?: string }).__navigationSentinel = value;
    return value;
  });

  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: '菜单', exact: true }).click();
  }
  await page.locator('#starlight__sidebar').getByRole('link', { name: '状态、工具与记忆', exact: true }).click();

  await expect(page).toHaveURL(/\/agent\/state-tools-memory\/$/);
  await expect(page.getByRole('heading', { level: 1, name: '状态、工具与记忆' })).toBeVisible();
  const sentinelAfterNavigation = await page.evaluate(
    () => (window as Window & { __navigationSentinel?: string }).__navigationSentinel,
  );
  expect(sentinelAfterNavigation).toBe(sentinel);
  await page.getByRole('button', { name: '标记本课完成' }).click();
  await expect(page.getByRole('status')).toHaveText('本课已完成');
});

test('table of contents groups the expanded agent lesson into six learning phases', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'the right-side table of contents is desktop-only');
  await page.goto('/agent/workflow-vs-agent/');
  const toc = page.getByRole('navigation', { name: '本页内容' });
  await expect(toc.getByRole('link', { name: '一、先选择最小编排' })).toBeVisible();
  await expect(toc.getByRole('link', { name: '六、完成本课' })).toBeVisible();
  await expect(toc.getByRole('link', { name: '2. 编排模式：不是只有“固定”或“自主”两档' })).toHaveCount(0);
  await expect(toc.getByRole('link', { name: '2.1 Prompt Chaining' })).toHaveCount(0);
  await expect(toc.getByRole('link')).toHaveCount(7);
});

test('lesson prerequisites use reader-facing Chinese actions', async ({ page }) => {
  await page.goto('/agent/workflow-vs-agent/');
  const prerequisites = page.getByRole('complementary', { name: '开始前需要掌握' });
  await expect(prerequisites.getByText('前置知识', { exact: true })).toBeVisible();
  await expect(prerequisites.getByText('BEFORE YOU START', { exact: true })).toHaveCount(0);
  await expect(prerequisites.getByRole('link').first()).toContainText('打开课程 →');
});

test('roadmap filters without losing the selected direction prerequisites', async ({ page }) => {
  await page.goto('/roadmap/');

  await page.getByLabel('查看路径').selectOption('agent-runtime-evaluation');
  const workflowNode = page.locator('.roadmap__node').filter({ hasText: 'Workflow 与 Agent' });
  await expect(workflowNode).toBeVisible();
  await expect(workflowNode).toContainText('编排模式、控制循环、预算与终止条件');
  await expect(page.getByText('可学习', { exact: true })).toHaveCount(0);
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

test('term peek remains interactive while the pointer crosses into its panel', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'hover-gap behavior is desktop-specific');
  await page.goto('/agent/workflow-vs-agent/');

  const firstTerm = page.locator('.term-peek').first();
  const trigger = firstTerm.locator('dfn');
  const panel = firstTerm.locator('.term-peek__panel');
  await trigger.hover();
  await expect(panel).toBeVisible();

  const triggerBox = await trigger.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  if (!triggerBox || !panelBox) throw new Error('term peek geometry is unavailable');

  await page.mouse.move(triggerBox.x + triggerBox.width / 2, triggerBox.y + triggerBox.height - 1);
  await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + 2, { steps: 12 });
  await expect(panel).toBeVisible();
  await panel.getByRole('link', { name: /打开术语条目/ }).click();
  await expect(page).toHaveURL(/\/glossary\/#/);
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
      path: '/agent/workflow-vs-agent/',
      heading: '控制权必须留在程序',
      component: '.agent-control-loop',
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

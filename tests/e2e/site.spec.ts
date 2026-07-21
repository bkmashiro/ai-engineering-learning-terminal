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
    '/foundations/software-systems/network-streaming/',
    '/foundations/llm/',
    '/agent/workflow-vs-agent/',
    '/directions/',
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, `${path}: ${results.violations.map((item) => item.id).join(', ')}`).toEqual([]);
  }
});

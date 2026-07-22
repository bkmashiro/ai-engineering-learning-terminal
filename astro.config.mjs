// @ts-check
import preact from '@astrojs/preact';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';

/**
 * @typedef {object} HastNode
 * @property {string} [type]
 * @property {string} [tagName]
 * @property {Record<string, unknown>} [properties]
 * @property {HastNode[]} [children]
 */

/**
 * Markdown tables are horizontal scroll containers in Starlight. Making them
 * focusable lets keyboard users reach and scroll wide tables without adding a
 * client-side enhancement.
 * @returns {(tree: HastNode) => void}
 */
function rehypeFocusableTables() {
  /** @param {HastNode} tree */
  function transform(tree) {
    /** @param {HastNode | undefined | null} node */
    function visit(node) {
      if (node?.type === 'element' && node.tagName === 'table') {
        node.properties ??= {};
        node.properties.tabIndex = 0;
      }
      for (const child of node?.children ?? []) visit(child);
    }
    visit(tree);
  }
  return transform;
}

export default defineConfig({
  site: 'https://ai-engineering-learning-terminal.pages.dev/',
  markdown: { processor: unified({ rehypePlugins: [rehypeFocusableTables] }) },
  integrations: [
    starlight({
      title: 'AI 工程学习终端',
      description: '从软件底座到 Agent 工程与就业方向的公开学习路线。',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/global.css'],
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
      },
      sidebar: [
        {
          label: '开始',
          items: [
            { label: '学习终端首页', slug: '' },
            { label: '完整学习路线', slug: 'roadmap' },
          ],
        },
        {
          label: '共同底座',
          items: [
            { label: '可复现与证据', slug: 'foundations/reproducibility' },
            { label: '状态、事件与复杂度', slug: 'foundations/software-systems/state-and-events' },
            { label: '网络、流式与取消', slug: 'foundations/software-systems/network-streaming' },
            { label: '事务、缓存与队列', slug: 'foundations/software-systems/data-reliability' },
            { label: '机器学习与实验', slug: 'foundations/ml' },
          ],
        },
        {
          label: 'LLM 应用',
          items: [
            { label: 'Token、Attention与上下文', slug: 'foundations/llm' },
            { label: '检索、引用与无答案', slug: 'foundations/llm/retrieval' },
          ],
        },
        {
          label: 'Agent 工程',
          items: [
            { label: 'Workflow 与 Agent', slug: 'agent/workflow-vs-agent' },
            { label: '状态、工具与记忆', slug: 'agent/state-tools-memory' },
          ],
        },
        {
          label: '安全与生产',
          items: [
            { label: '安全、评测与回放', slug: 'safety-evaluation' },
            { label: '生产化综合项目', slug: 'capstone' },
          ],
        },
        {
          label: '方向与参考',
          items: [
            { label: '方向总览', slug: 'directions' },
            { label: 'Agent 应用与产品工程', slug: 'directions/agent-applications' },
            { label: 'Agent Runtime、Harness 与评测', slug: 'directions/agent-runtime-evaluation' },
            { label: 'AI 后端与可靠性工程', slug: 'directions/ai-backend-reliability' },
            { label: 'LLM、搜索与检索工程', slug: 'directions/llm-search-retrieval' },
            { label: 'GUI、OS 与多模态 Agent', slug: 'directions/gui-multimodal-agents' },
            { label: '游戏 AI 与交互式叙事', slug: 'directions/game-ai-interactive-narrative' },
            { label: '端侧与推理工程', slug: 'directions/edge-inference' },
            { label: '术语表', slug: 'glossary' },
            { label: '来源', slug: 'sources' },
            { label: '关于本站', slug: 'about' },
          ],
        },
      ],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      lastUpdated: true,
      pagination: true,
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#f7f8fb' } },
        { tag: 'meta', attrs: { name: 'color-scheme', content: 'light dark' } },
      ],
    }),
    preact(),
  ],
});

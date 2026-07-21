// @ts-check
import preact from '@astrojs/preact';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
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
          label: 'Agent 工程',
          items: [{ label: 'Workflow 与 Agent', slug: 'agent/workflow-vs-agent' }],
        },
        {
          label: '方向与参考',
          items: [
            { label: '就业方向', slug: 'directions' },
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

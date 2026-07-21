export interface PublicSource {
  id: string;
  title: string;
  publisher: string;
  canonicalUrl: string;
  sourceLocale: 'en' | 'zh-CN';
  version?: string;
  accessedAt: string;
  licenseNote: string;
  usage: 'summary' | 'short-quote' | 'spec-reference' | 'paper-reference';
}

export const publicSources: PublicSource[] = [
  {
    id: 'curriculum-method',
    title: 'AI 工程公共学习路线',
    publisher: 'AI 工程学习终端',
    canonicalUrl: '/roadmap/',
    sourceLocale: 'zh-CN',
    version: '0.1',
    accessedAt: '2026-07-21',
    licenseNote: '本站原创课程结构。',
    usage: 'summary',
  },
  {
    id: 'building-effective-agents',
    title: 'Building Effective AI Agents',
    publisher: 'Anthropic Research',
    canonicalUrl: 'https://www.anthropic.com/research/building-effective-agents',
    sourceLocale: 'en',
    accessedAt: '2026-07-21',
    licenseNote: '仅作摘要和概念来源；不转载全文。',
    usage: 'summary',
  },
  {
    id: 'mcp-architecture',
    title: 'Model Context Protocol — Architecture',
    publisher: 'Model Context Protocol',
    canonicalUrl: 'https://modelcontextprotocol.io/specification/2025-11-25/architecture',
    sourceLocale: 'en',
    version: '2025-11-25',
    accessedAt: '2026-07-21',
    licenseNote: '协议职责与边界的规范来源。',
    usage: 'spec-reference',
  },
  {
    id: 'owasp-agent-security',
    title: 'AI Agent Security Cheat Sheet',
    publisher: 'OWASP Cheat Sheet Series',
    canonicalUrl: 'https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html',
    sourceLocale: 'en',
    accessedAt: '2026-07-21',
    licenseNote: '用于安全原则摘要并保留原始链接。',
    usage: 'summary',
  },
];

export function validateSources(sources: PublicSource[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const source of sources) {
    if (ids.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
    ids.add(source.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)) {
      errors.push(`invalid accessedAt for ${source.id}`);
    }
  }
  return errors;
}

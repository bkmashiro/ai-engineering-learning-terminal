import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface PublicContentViolation {
  file: string;
  rule: 'absolute-local-path' | 'application-content' | 'personal-contact' | 'secret' | 'source-map';
  match: string;
}

const textExtensions = new Set(['.astro', '.css', '.html', '.json', '.md', '.mdx', '.svg', '.ts', '.tsx']);
const rules: Array<{
  rule: PublicContentViolation['rule'];
  pattern: RegExp;
}> = [
  { rule: 'absolute-local-path', pattern: /\/(?:Users|home)\/[A-Za-z0-9._-]+\//g },
  {
    rule: 'application-content',
    pattern: /投递状态|岗位\s*ID|面经|薪资|(?:^|\W)offer(?:\W|$)|application\s+status/gi,
  },
  {
    rule: 'personal-contact',
    pattern:
      /(?:\+\d[\d\s()-]{8,}\d|(?<!\d)1[3-9]\d{9}(?!\d)|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
  },
  {
    rule: 'secret',
    pattern:
      /(?:(?:^|[?&])token=[A-Za-z0-9_%+/=-]{12,}|(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g,
  },
];

export function findPublicContentViolations(text: string, file: string): PublicContentViolation[] {
  const violations: PublicContentViolation[] = [];
  for (const { rule, pattern } of rules) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      violations.push({ file, rule, match: match[0].trim().slice(0, 80) });
    }
  }
  return violations;
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

export function auditPublicTree(root = process.cwd()): PublicContentViolation[] {
  const scanRoots = ['src', 'public', 'dist'].map((path) => resolve(root, path));
  const violations: PublicContentViolation[] = [];

  for (const file of scanRoots.flatMap(walk)) {
    const displayPath = relative(root, file);
    if (file.endsWith('.map')) {
      violations.push({ file: displayPath, rule: 'source-map', match: displayPath });
      continue;
    }
    if (!textExtensions.has(extname(file))) continue;
    const text = readFileSync(file, 'utf8');
    violations.push(...findPublicContentViolations(text, displayPath));
  }
  return violations;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const violations = auditPublicTree();
  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`${violation.file}: ${violation.rule}: ${violation.match}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Public content audit passed.');
  }
}

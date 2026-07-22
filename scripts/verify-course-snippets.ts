import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';

interface Snippet {
  language: string;
  title: string;
  content: string;
  source: string;
}

const projectRoot = process.cwd();
const docsRoot = resolve(projectRoot, 'src/content/docs');

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  }));
  return nested.flat();
}

async function collectSnippets(): Promise<Snippet[]> {
  const snippets: Snippet[] = [];
  const files = (await collectFiles(docsRoot)).filter((path) => extname(path) === '.mdx');
  const fence = /```([a-z0-9]+)[^\n]*\btitle="([^"]+)"[^\n]*\n([\s\S]*?)\n```/gi;

  for (const path of files) {
    const source = await readFile(path, 'utf8');
    for (const match of source.matchAll(fence)) {
      const [, language, title, content] = match;
      if (!title || !content || !language) continue;
      if (!['.ts', '.py', '.json'].includes(extname(title))) continue;
      if (!title.startsWith('examples/')) continue;
      if (basename(title) !== title.split('/').at(-1)) {
        throw new Error(`invalid snippet title path in ${path}: ${title}`);
      }
      snippets.push({ language, title, content, source: path });
    }
  }
  return snippets;
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${command} ${args.join(' ')} failed:\n${output}`);
  }
}

const snippets = await collectSnippets();
const tempRoot = await mkdtemp(join(tmpdir(), 'ai-engineering-course-snippets-'));

try {
  await writeFile(join(tempRoot, 'package.json'), '{"type":"module"}\n', 'utf8');
  const titles = new Map<string, string>();
  const written: Array<Snippet & { path: string }> = [];

  for (const snippet of snippets) {
    const fileName = basename(snippet.title);
    const previous = titles.get(fileName);
    if (previous) {
      throw new Error(`duplicate titled snippet ${fileName}: ${previous} and ${snippet.source}`);
    }
    titles.set(fileName, snippet.source);
    const path = join(tempRoot, fileName);
    await writeFile(path, `${snippet.content}\n`, 'utf8');
    written.push({ ...snippet, path });
  }

  const typeScriptFiles = written.filter((item) => extname(item.path) === '.ts');
  if (typeScriptFiles.length > 0) {
    const tsc = resolve(projectRoot, 'node_modules/typescript/bin/tsc');
    const typeRoots = resolve(projectRoot, 'node_modules/@types');
    if (!existsSync(tsc) || !existsSync(typeRoots)) {
      throw new Error('TypeScript or @types/node is unavailable; run pnpm install first');
    }
    run(process.execPath, [
      tsc,
      '--ignoreConfig',
      '--noEmit',
      '--strict',
      '--target', 'ES2022',
      '--module', 'NodeNext',
      '--moduleResolution', 'NodeNext',
      '--types', 'node',
      '--typeRoots', typeRoots,
      '--skipLibCheck',
      ...typeScriptFiles.map((item) => item.path),
    ], tempRoot);
  }

  const runnableTypeScriptFiles = typeScriptFiles.filter((item) => basename(item.path).endsWith('.runnable.ts'));
  if (runnableTypeScriptFiles.length > 0) {
    const tsx = resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs');
    if (!existsSync(tsx)) throw new Error('tsx is unavailable; run pnpm install first');
    for (const item of runnableTypeScriptFiles) run(process.execPath, [tsx, item.path], tempRoot);
  }

  const pythonFiles = written.filter((item) => extname(item.path) === '.py');
  for (const item of pythonFiles) {
    if (!item.content.includes('# /// script') || !item.content.includes('# dependencies = [')) {
      throw new Error(`${item.title} must declare PEP 723 dependencies`);
    }
    run('python3', ['-m', 'py_compile', item.path], tempRoot);
  }

  const jsonFiles = written.filter((item) => extname(item.path) === '.json');
  for (const item of jsonFiles) JSON.parse(item.content);

  console.log(
    `Course snippets verified: ${typeScriptFiles.length} TypeScript (${runnableTypeScriptFiles.length} executed), ${pythonFiles.length} Python, ${jsonFiles.length} JSON.`,
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

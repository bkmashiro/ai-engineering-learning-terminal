# AI 工程学习终端

一个中文优先、静态、内容型的 AI 工程教学网站。从共同软件与 AI 底座开始，逐步进入 LLM、Agent、安全、评测与生产化，最后才按就业方向分支。

## 技术栈

- Astro + Starlight
- MDX 内容页
- Preact Islands，仅用于交互实验
- TypeScript strict
- Vitest、Playwright、axe
- 静态 HTML 输出，无后端、账户或第三方追踪

## 本地开发

```bash
pnpm install
pnpm dev
```

构建和完整门禁：

```bash
pnpm gate
```

单项命令：

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:public
pnpm test:e2e
```

## 内容结构

```text
src/content/docs/        公开中文课程
src/components/content/  静态教学图示与内容组件
src/components/learning/ 交互实验
src/data/                typed 路线、方向、术语和来源
src/lib/                 浏览器本地进度存储边界
scripts/                 发布前安全门禁
```

## 公开边界

此仓库只接收公开白名单内容。禁止加入真实申请记录、特定岗位资料、个人联系方式、私有项目数据、凭据、本机路径或任何从私有工作区自动同步的文件。

英文来源只能经过摘录选择、中文改写、术语复核和主控验收后进入课程；不发布整篇机器翻译。

## 第一版

- 教学网站式的清晰导航和排版；
- 完整学习路线与方向筛选；
- 两节基础补给课与 `Workflow 与 Agent` 首课；
- 系统分层、网络生命周期、上下文预算与架构选择图；
- 可切换正常/故障路径的 SVG Agent Loop；
- 带版本号的浏览器本地学习进度；
- 从 canonical typed data 生成的前置模块链接和术语 Peek；
- 七个抽象就业方向；
- 术语和来源索引。

## 部署

- Production: <https://ai-engineering-learning-terminal.pages.dev/>
- Cloudflare Pages 从 `main` 构建
- 构建命令：`pnpm build`
- 输出目录：`dist`

许可证将在人工终验后单独决定。

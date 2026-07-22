# AI 工程学习终端

一套中文 AI 工程课程，从软件系统与机器学习基础出发，逐步进入 LLM、Agent、安全评测和生产化。

**在线阅读：** <https://ai-engineering-learning-terminal.pages.dev/>

## 从哪里开始

第一次系统学习，建议从[可复现与证据](https://ai-engineering-learning-terminal.pages.dev/foundations/reproducibility/)开始，按[完整学习路线](https://ai-engineering-learning-terminal.pages.dev/roadmap/)依次推进。

已经熟悉部分主题，可以直接查看路线中的前置关系，从对应课程开始。每个模块都包含机制解释、图示、最小实现、故障路径、实验和验收条件。

## 课程内容

- **共同底座：** 可复现证据、状态机、网络与流式、事务与队列、机器学习实验；
- **LLM 应用：** Token、Attention、上下文预算、检索、引用与无答案；
- **Agent 工程：** Workflow 边界、工具契约、状态、记忆与可审计 Runner；
- **安全与生产：** 威胁模型、可执行评测、回放、SLO、降级、对账与综合项目；
- **方向分支：** Agent 应用、Runtime 与评测、AI 后端、检索、多模态 GUI Agent、游戏 AI、端侧推理。

## 学习方式

1. 先理解机制和系统边界；
2. 通过图示观察数据流与状态变化；
3. 完成课程中的最小实现；
4. 注入故障并验证恢复路径；
5. 对照验收条件检查结果。

课程中的关键术语链接到统一术语表，引用材料集中列在来源页。

## 本地阅读

```bash
pnpm install
pnpm dev
```

然后打开终端输出的本地地址。

## 反馈

发现技术错误、失效来源或难以理解的段落，欢迎提交 Issue 或 Pull Request。

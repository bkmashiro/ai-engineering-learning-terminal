# 缓存工程主实验

这是课程 `cache-reuse-consistency` 的确定性 TypeScript 实验。它使用固定 Manifest 和虚拟时钟，不访问网络、不调用真实数据库、缓存服务、Embedding 或模型。

```bash
pnpm lab:cache
```

该命令会比较以下配置：

- `no-cache`
- `lru-naive`
- `lru-ttl`
- `lru-singleflight-safe`
- `frequency-admission-safe`
- `semantic-negative-control`

并写出：

- `artifacts/cache-reuse/report.json`：结构化结果、请求结果与 17 条验收断言；
- `artifacts/cache-reuse/report.md`：便于人工审核的摘要。

报告包含 Request/Safe Hit Rate、Byte/Safe Byte Hit Rate、Compute Saved Ratio、Origin Calls、Fill Amplification、Stale/Unsafe/Semantic False Hits、Evictions、Admission Rejects 与虚拟延迟 p50/p95/p99。

所有字节、Compute Unit 和延迟都是 `cache-workload.json` 声明的合成教学数据。`frequency-admission` 是为了隔离 Admission 与 Eviction 的简化精确频率策略，不是 TinyLFU 或 W-TinyLFU 的复刻；结果不能外推为厂商性能或生产命中率。

# Research

## Decision: 继续使用 BroadcastChannel 进行同源跨 Tab 通信
- Rationale: 浏览器原生 API，已被现有库使用，满足同源多 Tab 通信；spec 也要求 BroadcastChannel 不可用时降级。
- Alternatives considered: SharedWorker、ServiceWorker、window.postMessage（复杂度更高或适配性较差）。

## Decision: 使用序列化载荷进行跨 Tab 消息传输
- Rationale: BroadcastChannel 仅支持结构化克隆；拖拽数据应保持可序列化，符合现有 message 设计。
- Alternatives considered: 传 DOM 引用或函数（不被支持）。

## Decision: 以子类静态 channelName 建立通道并检测冲突
- Rationale: FR-003/FR-003a 明确要求；可避免跨类串扰。
- Alternatives considered: 全局单通道 + 运行时过滤（增加串扰风险）。

## Decision: 跨 Tab 回调同步触发与同类广播
- Rationale: FR-005/FR-005a/FR-005b 明确同步触发并广播到同类实例；未实现扩展点需安全跳过。
- Alternatives considered: 异步触发、仅单实例分发。

## Decision: 未注册 className 与通道不可用的处理
- Rationale: FR-008/FR-009 明确要求记录 warning/error 并忽略或降级。
- Alternatives considered: 静默忽略、抛异常中断流程。

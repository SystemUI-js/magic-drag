# Research Notes: Demo MagicDrag 展示完善

## Decision Log

### 1) Drag Start 全 Tab 通知
- **Decision**: 使用现有 BroadcastChannel 事件管线在拖拽开始时广播消息。
- **Rationale**: 与库的跨 Tab 通信机制一致，且能在 demo 中展示事件驱动流程。
- **Alternatives considered**: 仅在目标 Tab 进入时通知；会错过“开始即实例化”的演示要求。

### 2) 目标 Tab 实例化时机
- **Decision**: 非源 Tab 在收到拖拽开始消息后立刻实例化卡片（可进入展示/预览状态）。
- **Rationale**: 满足“开始即通知并实例化”的需求，提升演示可见性。
- **Alternatives considered**: 仅在拖拽进入目标 Tab 时实例化；不符合 FR-001/FR-002。

### 3) 非源 Tab 结束触发源 Tab 销毁
- **Decision**: 当非源 Tab 触发拖拽结束/放置事件时，向源 Tab 发送带实例 ID 的结束信号，源 Tab 负责销毁。
- **Rationale**: 维持库“源创建、源销毁”的边界，并避免重复实例残留。
- **Alternatives considered**: 非源 Tab 直接销毁源卡片；违反职责边界且不可跨 Tab 直接操作。

### 4) 依赖与类型策略
- **Decision**: 不新增依赖；保持显式 TypeScript 类型，不使用 any。
- **Rationale**: 与宪法约束一致，减少引入风险。
- **Alternatives considered**: 引入事件/状态管理依赖；不必要且增加复杂度。

### 5) 事件日志面板结构化输出
- **Decision**: 使用结构化日志条目（方法名、时间戳、Tab ID、实例 ID、关键参数摘要）驱动 UI 面板展示。
- **Rationale**: 满足 FR-004，并可直观展示 MagicDrag 基类方法与事件回调的触发顺序。
- **Alternatives considered**: 仅在控制台输出；不可见于 UI，演示效果不足。

### 6) BroadcastChannel 清理与稳定性
- **Decision**: 复用现有 manager 生命周期，必要时在 demo 侧补充页面卸载清理与心跳监听展示（不改变库核心逻辑）。
- **Rationale**: BroadcastChannel 有监听器与通道释放要求，演示场景应尽量避免残留状态。
- **Alternatives considered**: 不处理清理；可能在频繁刷新/切换 Tab 时出现残留与误判。

### 7) Demo 与库边界与扩展点
- **Decision**: Demo 仅使用 `MagicDrag` 子类与 `MagicDragManager.addEventListener` 的事件分发能力，不修改库内跨 Tab 逻辑。
- **Rationale**: 遵守库边界（源创建/销毁、消息分发由库负责），demo 只负责展示与状态拼装。
- **Alternatives considered**: 直接修改库以注入 demo 展示逻辑；会破坏库职责边界。

# Feature Specification: Demo MagicDrag 展示完善

**Feature Branch**: `003-demo-magicdrag`  
**Created**: 2026-01-22  
**Status**: Draft  
**Input**: User description: "003 进行以下任务，以更新 demo：
1. 尽可能多得适配 MagicDrag 基类方法，展示在 demo 中。
2. demo 中卡片拖拽初始时通知所有 Tab ，并实例化卡片
3. 卡片在源 Tab  以外的 Tab onDragEnd，则销毁源 Tab 中的卡片
4. 修复 demo 中的逻辑漏洞"

## Clarifications

### Session 2026-01-23

- Q: MagicDrag 基类方法调用与结果应如何展示？ → A: 页面内事件日志面板，列表展示方法名、时间与关键参数摘要
- Q: Card 的唯一标识策略？ → A: 使用 UUID 作为 Card 唯一标识
- Q: 拖拽开始后哪些 Tab 需要实例化卡片？ → A: 所有 Tab 都实例化（含源 Tab）
- Q: onDragEnd 在非源 Tab 触发时，谁负责销毁源 Tab 卡片？ → A: 源 Tab 接收通知后销毁

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 跨 Tab 拖拽演示完整流程 (Priority: P1)

作为 demo 使用者，我需要在多个浏览器 Tab 中拖拽卡片，并看到跨 Tab 的创建、预览、结束与销毁流程完整演示，从而理解 MagicDrag 的核心能力。

**Why this priority**: 这是 demo 的核心价值，必须先保证跨 Tab 拖拽流程可完整演示。

**Independent Test**: 在两个同源 Tab 中拖拽卡片，观察进入目标 Tab 后能看到卡片实例化并正常结束。

**Acceptance Scenarios**:

1. **Given** 同源的两个 Tab 已打开 demo，**When** 在源 Tab 开始拖拽卡片并移入目标 Tab，**Then** 目标 Tab 立即收到开始通知并实例化卡片。
2. **Given** 卡片已在目标 Tab 实例化，**When** 在目标 Tab 触发拖拽结束，**Then** 源 Tab 中对应卡片被销毁且不会重复保留。

---

### User Story 2 - MagicDrag 基类能力展示 (Priority: P2)

作为 demo 使用者，我需要在 demo 中看到尽可能多的基类能力被调用或展示，以便理解可扩展的接口与事件。

**Why this priority**: 需要通过 demo 体现基类能力，帮助用户理解如何扩展。

**Independent Test**: 在 demo UI 中操作卡片并触发各类基类方法对应的行为或日志展示。

**Acceptance Scenarios**:

1. **Given** demo 已加载并展示卡片，**When** 用户执行拖拽相关操作，**Then** 页面内事件日志面板显示对应基类方法的调用与结果。

---

### User Story 3 - Demo 逻辑稳定性 (Priority: P3)

作为 demo 使用者，我需要 demo 在各种拖拽情况下不出现异常或状态不一致，从而可信地展示库能力。

**Why this priority**: 逻辑漏洞会破坏演示可信度，但优先级低于核心流程与展示能力。

**Independent Test**: 连续多次拖拽并切换 Tab，不出现重复实例、残留卡片或异常状态。

**Acceptance Scenarios**:

1. **Given** 用户重复执行跨 Tab 拖拽，**When** 触发结束或取消，**Then** demo 状态保持一致且无残留卡片。

---

### Edge Cases

- 当拖拽开始后未进入任何目标 Tab 并结束时，系统应清理临时实例。
- 当目标 Tab 未激活或延迟收到通知时，系统仍能避免重复实例化。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Demo MUST 在拖拽开始时向所有 Tab 广播通知。
- **FR-002**: 接收到开始通知的 Tab MUST 实例化对应卡片并进入可展示状态，所有 Tab（含源 Tab）均需实例化。
- **FR-003**: 当非源 Tab 触发拖拽结束时，源 Tab MUST 销毁对应卡片实例。
- **FR-003a**: 源 Tab MUST 在接收到 onDragEnd 通知后执行销毁。
- **FR-004**: Demo MUST 尽可能多地调用并展示 MagicDrag 基类的核心方法与事件结果，并通过页面内事件日志面板展示方法名、时间与关键参数摘要。
- **FR-005**: Demo MUST 处理重复拖拽、异常结束等情况并避免状态残留。
- **FR-006**: 每个 Card MUST 具有全局唯一的 UUID 标识以用于跨 Tab 关联。

### Key Entities *(include if feature involves data)*

- **Card**: Demo 中的拖拽单元，包含唯一标识与展示内容。
- **Tab Session**: 同源浏览器 Tab 的实例信息，用于区分源与目标。
- **Drag Event**: 拖拽事件状态，包含开始、进入、结束等阶段标识。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 在两个同源 Tab 中，用户可在 10 秒内完成一次跨 Tab 拖拽并看到完整流程。
- **SC-002**: 95% 的跨 Tab 拖拽操作在结束后无残留卡片。
- **SC-003**: 90% 的 demo 参与者可以通过演示识别出至少 3 个基类能力。
- **SC-004**: 连续 20 次拖拽测试中无逻辑异常导致的流程中断。

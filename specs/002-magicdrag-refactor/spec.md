# Feature Specification: MagicDrag API Decoupling

**Feature Branch**: `001-magicdrag-refactor`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "ulw 实现一些重构改造：
1. MagicDrag 基类不应该知道 Manager，只需暴露一些 API 给 Manager 使用即可
2. channelName 直接作为静态属性放在类定义中，Manager 在注册 MagicDrag 子类和绑定通信的时候直接使用这个静态属性即可
3. 用户在使用时，首先要在 Manager 上注册子类
4. Manager 会调用 MagicDrag 子类的一些方法，可以是静态方法或非静态方法。注意这些给用户使用的方法在父类不应该有内容，而是留给子类定义用的
5. Manager 调用 MagicDrag 的静态方法 onEnterTab，在拖拽进当前 Tab 时触发
6. Manager 调用 MagicDrag 的子类属性 onOtherTabDragStart, onOtherTabDragMove, onOtherTabDragEnd，代表在其他 Tab 中，有相同的子类进行了一些拖拽操作"

## Clarifications

### Session 2026-01-21

- Q: 当多个子类共享相同 channelName 时，Manager 如何处理冲突？ → A: 注册时检测冲突并拒绝注册
- Q: 子类未实现扩展点时如何处理？ → A: 未实现则安全跳过
- Q: 跨 Tab 回调应同步还是异步触发？ → A: 同步调用
- Q: 同一 Tab 内多个同类实例时，其他 Tab 拖拽回调如何分发？ → A: 触发同一类的所有已注册实例回调
- Q: 未注册 className 的跨 Tab 消息如何处理？ → A: 记录包含 className 的 warning 并忽略该消息
- Q: BroadcastChannel 不可用或初始化失败时如何处理？ → A: 记录 error 并降级为单 Tab 行为

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 注册子类并完成跨 Tab 拖拽 (Priority: P1)

库使用者希望先在 Manager 中注册自定义拖拽子类，再进行跨 Tab 拖拽操作，并能在目标 Tab 正确触发进入回调。

**Why this priority**: 注册流程是所有跨 Tab 拖拽能力的前置条件，未完成注册无法使用功能。

**Independent Test**: 仅实现注册与进入事件即可验证最小可用流程：注册子类后，从其他 Tab 拖入当前 Tab 触发进入回调。

**Acceptance Scenarios**:

1. **Given** Manager 已注册某个拖拽子类，**When** 另一 Tab 将该子类实例拖入当前 Tab，**Then** 该子类的进入回调被触发一次
2. **Given** 未注册该子类，**When** 另一 Tab 将该子类实例拖入当前 Tab，**Then** 不触发进入回调且不会影响已注册子类

---

### User Story 2 - 观察其他 Tab 的拖拽状态 (Priority: P2)

库使用者希望在当前 Tab 中得知其他 Tab 内相同子类的拖拽开始、移动和结束事件，以实现跨 Tab 状态联动。

**Why this priority**: 跨 Tab 协作是高级用法，需要在完成基础注册与进入流程后使用。

**Independent Test**: 仅实现并触发其他 Tab 拖拽状态回调即可验证该能力，不依赖进入回调。

**Acceptance Scenarios**:

1. **Given** Manager 已注册某子类且该子类定义了其他 Tab 回调，**When** 另一 Tab 开始拖拽该子类实例，**Then** 当前 Tab 收到开始回调
2. **Given** 当前 Tab 已收到开始回调，**When** 另一 Tab 结束拖拽该子类实例，**Then** 当前 Tab 收到结束回调

---

### User Story 3 - 子类独立定义可被 Manager 调用的扩展点 (Priority: P3)

库使用者希望父类仅提供可被覆盖的 API，占位方法不包含默认逻辑，以便子类按需实现。

**Why this priority**: 这是架构要求，影响维护性，但不阻塞最基础功能。

**Independent Test**: 创建一个仅实现部分扩展点的子类，确保未实现的方法不会在父类中产生默认行为。

**Acceptance Scenarios**:

1. **Given** 子类未实现某个扩展点，**When** Manager 调用该扩展点，**Then** 不产生任何默认行为

---

### Edge Cases

- 当多个子类共享相同 channelName 时，注册流程应拒绝并明确报错
- 当某子类未实现 onEnterTab 或其他 Tab 回调时，系统应安全跳过且不报错

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须允许在 Manager 中注册 MagicDrag 子类后才能参与跨 Tab 拖拽
- **FR-002**: MagicDrag 基类必须不依赖 Manager，且仅暴露供 Manager 调用的扩展点
- **FR-003**: 系统必须从子类的静态 channelName 获取通信通道名称并用于注册与通信绑定
- **FR-003a**: 当注册的 channelName 与已注册子类冲突时，系统必须拒绝注册并给出明确错误
- **FR-004**: Manager 必须在拖拽进入当前 Tab 时调用子类的静态 onEnterTab 扩展点
- **FR-005**: Manager 必须在检测到其他 Tab 的拖拽开始、移动、结束时调用子类实例的 onOtherTabDragStart/onOtherTabDragMove/onOtherTabDragEnd
- **FR-005b**: 同一 Tab 内存在多个同类实例时，其他 Tab 的拖拽回调必须广播到该类所有已注册实例
- **FR-005a**: 跨 Tab 回调触发应为同步调用
- **FR-006**: 如果子类未实现某个扩展点，系统必须安全忽略该调用而不影响其他功能
- **FR-007**: 未实现扩展点的调用不得抛出错误或中断其他子类回调
- **FR-008**: 当接收到未注册 className 的跨 Tab 消息时，Manager 必须记录包含 className 的 warning 并忽略该消息
- **FR-009**: 当 BroadcastChannel 不可用或初始化失败时，系统必须记录 error 并降级为单 Tab 行为

### Key Entities *(include if feature involves data)*

- **MagicDrag 子类**: 用户自定义拖拽类型，包含静态 channelName 与可选扩展点
- **Manager 注册表**: 记录已注册子类及其 channelName 的集合
- **跨 Tab 拖拽事件**: 来自其他 Tab 的拖拽开始、移动、结束与进入事件

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户在完成子类注册后，能在一次跨 Tab 拖拽中稳定触发进入回调
- **SC-002**: 在其他 Tab 执行拖拽时，当前 Tab 能在 1 秒内收到开始与结束回调
- **SC-003**: 未实现扩展点的子类不会导致运行时错误或阻断其他子类的回调
- **SC-004**: 至少 90% 的跨 Tab 拖拽演示用例可在首次尝试中按预期触发对应回调

## Assumptions

- 用户会在应用启动阶段完成子类注册
- 拖拽事件能够在不同 Tab 之间可靠传递

# Feature Specification: Manager Dispatch Refactor

**Feature Branch**: `001-manager-dispatch`  
**Created**: 2026-01-19  
**Status**: Draft  
**Input**: User description: "ulw 优化 @src/magic-drag/MagicDragManager.ts 中 Manager 的代码：
1. 简化代码，Manager 的主要职责是：负责识别不同类型的信号并分发；所以考虑让 信号区分的字（ChannelName）符串放在 MagicDrag 类上，定义在基类，实际填写在子类；MagicDrag 在注册到 Manager 的时候，Manager 直接从 MagicDrag 类上读取这个字符串；
2. NotifyDragStart, NotifyDragMove 等等之类的这种写法，太过于 case to case，应该用addEventListener 这种方式实现注册和分发
 3. 在初始 Drag 的时候赋值 activeTabId，在触发 onEnterTab 的时候切换 activeTabId"

## Clarifications

### Session 2026-01-19

- Q: ChannelName 是否要求全局唯一？ → A: 允许重复，共享同一通道并共同接收信号
- Q: 未注册处理器时的默认行为？ → A: 记录可观测信号（日志/计数）
- Q: 何时切换 activeTabId？ → A: 当指针进入目标标签页视口时触发并切换
- Q: 事件注册范围采用哪种？ → A: 全局事件注册，支持按通道可选过滤
- Q: 同一通道内事件如何避免误处理？ → A: 处理器需按拖拽类型与实例ID过滤

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 统一事件分发 (Priority: P1)

库的使用者希望拖拽管理器只负责识别信号类型并分发给已注册的处理器，而不是通过大量固定的分支逻辑处理。

**Why this priority**: 这直接决定管理器职责是否清晰，属于核心改动。

**Independent Test**: 仅注册一个事件处理器，触发对应信号后即可验证是否被正确分发。

**Acceptance Scenarios**:

1. **Given** 已注册某事件处理器，**When** 接收到对应信号，**Then** 处理器被调用且携带正确数据
2. **Given** 未注册某事件处理器，**When** 接收到对应信号，**Then** 不会抛异常且流程继续

---

### User Story 2 - 拖拽类型通道隔离 (Priority: P2)

库的使用者希望不同拖拽类型拥有独立的信号通道名称，并在注册时被系统自动读取和应用。

**Why this priority**: 通道隔离影响跨标签页通信的正确性，需要明确归属规则。

**Independent Test**: 注册一个拖拽类型后，验证系统使用的通道名称与该类型配置一致。

**Acceptance Scenarios**:

1. **Given** 拖拽类型声明通道名称，**When** 注册到系统，**Then** 通信使用该通道名称

---

### User Story 3 - 活跃标签页切换 (Priority: P3)

库的使用者希望拖拽过程中能正确标识当前活跃的标签页，并在进入目标标签页时更新活跃标识。

**Why this priority**: 影响拖拽流程状态一致性，但不阻断基本分发能力。

**Independent Test**: 触发开始拖拽与进入标签页事件后，检查活跃标签页标识是否正确更新。

**Acceptance Scenarios**:

1. **Given** 开始拖拽，**When** 触发开始事件，**Then** 活跃标签页标识设置为源标签页
2. **Given** 指针进入目标标签页视口，**When** 触发进入事件，**Then** 活跃标签页标识更新为目标标签页

---

### Edge Cases

- 未注册任何处理器时收到信号，系统应保持稳定并记录可观测信号（日志/计数）
- 同时存在多个拖拽类型时，信号通道不应互相干扰

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须以全局事件注册/分发的方式处理信号，支持按通道可选过滤，而非固定的分支逻辑，并在无处理器时记录可观测信号（日志/计数）
- **FR-002**: 系统必须允许每种拖拽类型声明信号通道名称，允许不同类型共享同一通道，处理器需按拖拽类型与实例ID过滤
- **FR-003**: 系统在注册拖拽类型时必须读取并应用该通道名称
- **FR-004**: 系统必须在拖拽开始时记录当前活跃标签页标识
- **FR-005**: 系统必须在指针进入目标标签页视口时切换活跃标签页标识

### Key Entities *(include if feature involves data)*

- **拖拽类型**: 可被注册并参与跨标签页拖拽的类型，包含通道名称配置
- **信号通道**: 用于跨标签页通信的通道名称，可被多个拖拽类型共享
- **活跃标签页标识**: 表示当前拖拽流程中应被视为活跃的标签页

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% 的已注册事件处理器在对应信号触发时被正确调用
- **SC-002**: 在多拖拽类型场景下，信号不会跨通道互相误触发
- **SC-003**: 活跃标签页标识在开始拖拽与进入目标标签页时始终与当前活跃标签页一致
- **SC-004**: 新增或替换信号处理逻辑不需要修改管理器的核心分发流程

---

description: "Tasks for MagicDrag API Decoupling"
---

# Tasks: MagicDrag API Decoupling

**Input**: Design documents from `/specs/002-magicdrag-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 用户场景为强制测试要求；需补充/更新单元测试。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 确认现有项目结构与入口文件（src/magic-drag/index.ts, src/magic-drag/MagicDrag.ts, src/magic-drag/MagicDragManager.ts）
- [X] T002 [P] 盘点现有跨 Tab 消息类型与 payload 类型定义（src/magic-drag/types.ts）
- [X] T003 [P] 确认现有单元测试基线与覆盖范围（src/__tests__/magic-drag.test.ts）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 定义/完善 MagicDrag 子类扩展点类型与契约（src/magic-drag/types.ts）
- [X] T005 定义 Manager 注册表结构与冲突检测策略（src/magic-drag/MagicDragManager.ts）
- [X] T006 [P] 定义诊断日志规范（包含 className/channelName/messageType）（src/magic-drag/MagicDragManager.ts）

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 注册子类并完成跨 Tab 拖拽 (Priority: P1) 🎯 MVP

**Goal**: 完成子类注册与跨 Tab 进入回调触发的最小可用流程。

**Independent Test**: 注册子类后，从其他 Tab 拖入当前 Tab 触发 onEnterTab；未注册 className 消息被忽略并记录 warning。

### Tests for User Story 1

- [X] T007 [P] [US1] 新增注册与进入回调的单元测试（src/__tests__/magic-drag.test.ts）
- [X] T008 [P] [US1] 新增未注册 className 的 warning 行为测试（src/__tests__/magic-drag.test.ts）

### Implementation for User Story 1

- [X] T009 [US1] 移除 MagicDrag 对 Manager 的耦合，保留可被调用的抽象扩展点（src/magic-drag/MagicDrag.ts）
- [X] T010 [US1] 读取子类静态 channelName 并注册，冲突时报错（src/magic-drag/MagicDragManager.ts）
- [X] T011 [US1] 处理 DRAG_ENTER_TAB 时调用子类静态 onEnterTab（src/magic-drag/MagicDragManager.ts）
- [X] T012 [US1] 未注册 className 消息记录 warning 并忽略（src/magic-drag/MagicDragManager.ts）

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 观察其他 Tab 的拖拽状态 (Priority: P2)

**Goal**: 当前 Tab 能收到其他 Tab 的拖拽开始/移动/结束回调并广播到同类实例。

**Independent Test**: 同类实例在其他 Tab 拖拽时，当前 Tab 同类所有实例收到 onOtherTabDragStart/onOtherTabDragMove/onOtherTabDragEnd。

### Tests for User Story 2

- [X] T013 [P] [US2] 新增跨 Tab 拖拽开始/移动/结束回调测试（src/__tests__/magic-drag.test.ts）
- [X] T014 [P] [US2] 新增同类多实例广播测试（src/__tests__/magic-drag.test.ts）

### Implementation for User Story 2

- [X] T015 [US2] 注册并维护同类实例集合（src/magic-drag/MagicDragManager.ts）
- [X] T016 [US2] 处理 DRAG_START/DRAG_MOVE/DRAG_END 调用实例 onOtherTabDrag*（src/magic-drag/MagicDragManager.ts）
- [X] T017 [US2] 同类实例回调同步广播（src/magic-drag/MagicDragManager.ts）

**Checkpoint**: User Story 2 should be independently functional

---

## Phase 5: User Story 3 - 子类独立定义可被 Manager 调用的扩展点 (Priority: P3)

**Goal**: 父类扩展点仅占位无默认逻辑，未实现时安全跳过。

**Independent Test**: 子类未实现扩展点时不产生默认行为也不抛错。

### Tests for User Story 3

- [X] T018 [P] [US3] 新增未实现扩展点安全跳过测试（src/__tests__/magic-drag.test.ts）

### Implementation for User Story 3

- [X] T019 [US3] 清理父类默认实现，确保调用时安全检测（src/magic-drag/MagicDrag.ts, src/magic-drag/MagicDragManager.ts）

**Checkpoint**: User Story 3 should be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T020 [P] 更新公开类型与使用说明（src/magic-drag/types.ts, src/magic-drag/index.ts）
- [X] T021 [P] 补充日志上下文信息（src/magic-drag/MagicDragManager.ts）
- [X] T022 运行并修复单元测试（src/__tests__/magic-drag.test.ts）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion; P1 → P2 → P3 recommended
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- Phase 1 tasks T002/T003 can run in parallel
- Phase 2 task T006 can run in parallel with T004/T005
- Tests within a user story can run in parallel

---

## Parallel Example: User Story 1

```text
Task: "新增注册与进入回调的单元测试（src/__tests__/magic-drag.test.ts）"
Task: "新增未注册 className 的 warning 行为测试（src/__tests__/magic-drag.test.ts）"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and validate User Story 1 independently

### Incremental Delivery

1. Setup + Foundational
2. User Story 1 → validate
3. User Story 2 → validate
4. User Story 3 → validate

### Parallel Team Strategy

- Setup/Foundational 完成后，可并行推进 US2/US3

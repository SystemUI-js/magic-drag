---

description: "Tasks for Demo MagicDrag 展示完善"
---

# Tasks: Demo MagicDrag 展示完善

**Input**: Design documents from `/specs/003-demo-magicdrag/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: 本需求未显式要求新增测试，因此不包含测试任务。

**Organization**: 按用户故事分组，确保每个故事可独立完成与验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无依赖）
- **[Story]**: 对应用户故事（US1/US2/US3）
- 描述中必须包含明确文件路径

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 对齐 demo 入口与基础结构

- [X] T001 盘点 demo 入口与现有卡片渲染逻辑 in `src/main.ts`
- [X] T002 明确 demo 与库边界及扩展点调用路径（仅记录）in `specs/003-demo-magicdrag/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事的共同前置

- [X] T003 定义 demo 内 Card/Tab/Log 运行时结构与缓存容器 in `src/main.ts`
- [X] T004 定义 UUID 生成与实例索引策略（Map/Set）并落地 in `src/main.ts`
- [X] T005 建立 demo 级事件日志数据结构与追加方法 in `src/main.ts`

**Checkpoint**: 基础数据结构完成，可进入用户故事实现

---

## Phase 3: User Story 1 - 跨 Tab 拖拽演示完整流程 (Priority: P1) 🎯 MVP

**Goal**: 拖拽开始即广播并在所有 Tab 实例化；目标 Tab 结束时通知源 Tab 销毁

**Independent Test**: 两个同源 Tab 拖拽卡片，目标 Tab 可立即实例化，且结束后源 Tab 卡片被销毁

### Implementation for User Story 1

- [X] T006 [US1] 在 DemoCard onDragStart 中记录序列化信息并触发广播日志 in `src/main.ts`
- [X] T007 [US1] 监听 DRAG_START 并在非源 Tab 立即实例化卡片 in `src/main.ts`
- [X] T008 [US1] 处理 DRAG_ENTER_TAB/DRAG_LEAVE_TAB 更新预览态与位置 in `src/main.ts`
- [X] T009 [US1] 处理非源 Tab onDragEnd 时向源 Tab 发送销毁信号 in `src/main.ts`
- [X] T010 [US1] 源 Tab 接收销毁信号并移除对应实例 in `src/main.ts`

**Checkpoint**: US1 可独立演示跨 Tab 创建、进入与结束销毁流程

---

## Phase 4: User Story 2 - MagicDrag 基类能力展示 (Priority: P2)

**Goal**: 在 UI 中展示尽可能多的基类方法与事件结果

**Independent Test**: 拖拽操作后，事件日志面板展示方法名、时间与关键参数摘要

### Implementation for User Story 2

- [X] T011 [US2] 渲染事件日志面板 UI（列表/滚动）in `src/main.ts`
- [X] T012 [US2] 将基类方法回调（onDragStart/onDragMove/onDragEnd/onAbort/onEnterTab/onLeaveTab）接入日志 in `src/main.ts`
- [X] T013 [US2] 记录序列化/反序列化摘要与 instanceId/TabId in `src/main.ts`

**Checkpoint**: 日志面板覆盖核心基类方法与事件流

---

## Phase 5: User Story 3 - Demo 逻辑稳定性 (Priority: P3)

**Goal**: 避免重复实例、残留卡片与异常结束状态

**Independent Test**: 连续拖拽/切换 Tab 不出现重复实例或残留卡片

### Implementation for User Story 3

- [X] T014 [US3] 去重逻辑：同 instanceId 仅保留一个实例 in `src/main.ts`
- [X] T015 [US3] 处理 DRAG_ABORT 与未进入目标 Tab 的清理流程 in `src/main.ts`
- [X] T016 [US3] 处理延迟通知与状态回放，避免重复实例化 in `src/main.ts`

**Checkpoint**: 多次拖拽稳定，无残留或重复

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事的收尾与可用性完善

- [X] T017 [P] 更新 demo 说明与手动验证步骤 in `specs/003-demo-magicdrag/quickstart.md`
- [X] T018 复查 contracts 与实际事件载荷一致性 in `specs/003-demo-magicdrag/contracts/drag-events.openapi.json`
- [X] T019 运行 quickstart 自检清单并记录结果 in `specs/003-demo-magicdrag/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖
- **Foundational (Phase 2)**: 依赖 Setup 完成
- **User Stories (Phase 3-5)**: 依赖 Foundational 完成，按优先级 P1 → P2 → P3
- **Polish (Phase 6)**: 依赖核心用户故事完成

### User Story Dependencies

- **US1 (P1)**: 可在 Foundational 后开始
- **US2 (P2)**: 可在 Foundational 后开始，但建议在 US1 事件流稳定后接入
- **US3 (P3)**: 在 US1 基础上补齐稳定性处理

### Parallel Opportunities

- T001 与 T002 可并行
- T003 与 T004 可并行
- T011 与 T013 可并行
- T017 可并行于 US3 收尾

---

## Parallel Example: User Story 1

```bash
Task: "监听 DRAG_START 并在非源 Tab 立即实例化卡片 in src/main.ts"
Task: "处理 DRAG_ENTER_TAB/DRAG_LEAVE_TAB 更新预览态与位置 in src/main.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1 + Phase 2
2. 完成 Phase 3（US1）并在双 Tab 验证
3. 停止并确认演示流程符合验收

### Incremental Delivery

1. US1 打通跨 Tab 流程
2. US2 加入日志面板与基类能力展示
3. US3 补齐异常与稳定性

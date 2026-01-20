---

description: "Task list for manager dispatch refactor"
---

# Tasks: Manager Dispatch Refactor

**Input**: Design documents from `/specs/001-manager-dispatch/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. No explicit test requirement in the spec, so tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Review existing drag manager flows in `src/magic-drag/MagicDragManager.ts`
- [x] T002 Review MagicDrag integration points in `src/magic-drag/MagicDrag.ts`
- [x] T003 Review event types in `src/magic-drag/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define event listener storage and dispatch API in `src/magic-drag/MagicDragManager.ts`
- [x] T005 Define channel name exposure on base class in `src/magic-drag/MagicDrag.ts`
- [x] T006 Update type exports for listener APIs in `src/magic-drag/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 统一事件分发 (Priority: P1) 🎯 MVP

**Goal**: 使用全局事件注册/分发替换 notifyDrag* 分支逻辑，并在无处理器时记录可观测信号

**Independent Test**: 仅注册一个事件处理器，触发对应信号后处理器被调用且携带正确数据；无处理器时流程继续且记录日志/计数。

### Implementation for User Story 1

- [x] T007 [US1] Replace notifyDrag* entry points with dispatch calls in `src/magic-drag/MagicDragManager.ts`
- [x] T008 [US1] Add addEventListener/removeEventListener APIs in `src/magic-drag/MagicDragManager.ts`
- [x] T009 [US1] Emit observability signal when no handlers exist in `src/magic-drag/MagicDragManager.ts`
- [x] T010 [US1] Route MagicDrag start/move/end calls through event system in `src/magic-drag/MagicDrag.ts`
- [x] T011 [US1] Align message payload typing with event map in `src/magic-drag/types.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 拖拽类型通道隔离 (Priority: P2)

**Goal**: 每个拖拽类型在注册时提供通道名称并由 Manager 自动读取应用

**Independent Test**: 注册一个拖拽类型后，系统使用的通道名称与该类型配置一致。

### Implementation for User Story 2

- [x] T012 [US2] Add static channelName contract and validation in `src/magic-drag/MagicDrag.ts`
- [x] T013 [US2] Read channelName during registration and map to constructors in `src/magic-drag/MagicDragManager.ts`
- [x] T014 [US2] Ensure shared channel support in `src/magic-drag/MagicDragManager.ts`
- [x] T015 [US2] Update signal contract documentation in `specs/001-manager-dispatch/contracts/drag-signals.openapi.yaml`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 活跃标签页切换 (Priority: P3)

**Goal**: 拖拽开始时设置 activeTabId，进入目标标签页视口时切换 activeTabId

**Independent Test**: 触发开始拖拽与进入标签页事件后，activeTabId 与当前活跃标签页一致。

### Implementation for User Story 3

- [x] T016 [US3] Set activeTabId on drag start in `src/magic-drag/MagicDragManager.ts`
- [x] T017 [US3] Switch activeTabId on enter-tab events in `src/magic-drag/MagicDragManager.ts`
- [x] T018 [US3] Verify activeTabId usage in drag end/drop flows in `src/magic-drag/MagicDrag.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 [P] Update docs and quickstart references in `specs/001-manager-dispatch/quickstart.md`
- [x] T020 [P] Run quickstart validation checklist in `specs/001-manager-dispatch/quickstart.md`
- [x] T021 [P] Update CHANGELOG under [Unreleased] in `CHANGELOG.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Models/entities before services (not applicable here)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup review tasks can run in parallel
- Foundational tasks T004-T006 can run in parallel
- Polish tasks T019-T021 can run in parallel

---

## Parallel Example: User Story 1

```bash
Task: "Replace notifyDrag* entry points in src/magic-drag/MagicDragManager.ts"
Task: "Add addEventListener/removeEventListener APIs in src/magic-drag/MagicDragManager.ts"
Task: "Route MagicDrag start/move/end calls through event system in src/magic-drag/MagicDrag.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. STOP and validate with the independent test criteria

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

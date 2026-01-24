# Tasks: Fix Demo Card Cleanup

**Input**: Design documents from `/specs/004-fix-demo-card-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested (manual verification per quickstart).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Review demo drag cleanup entry points in `src/main.ts` for alignment with spec

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create a shared demo-card cleanup helper that removes temporary elements and updates runtime state in `src/main.ts`
- [X] T003 Ensure runtime lookup by instanceId is centralized for cleanup callers in `src/main.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Drag Completion Cleans Temporary Card (Priority: P1) 🎯 MVP

**Goal**: Drag completion removes the temporary body-level demo-card in same-tab and cross-tab flows.

**Independent Test**: Drag a demo card and confirm no temporary demo-card remains under `document.body` after completion.

### Implementation for User Story 1

- [X] T004 [US1] Invoke shared cleanup helper on drag end to remove temporary demo-card in `src/main.ts`
- [X] T005 [US1] Handle `demo_destroy` cleanup signal after cross-tab drop in `src/main.ts`
- [X] T006 [US1] Ensure drag drop flow removes preview runtime cards and updates status in `src/main.ts`

**Checkpoint**: User Story 1 should be functional and testable independently

---

## Phase 4: User Story 2 - Cancelled Drags Also Clean Up (Priority: P2)

**Goal**: Aborted drags remove temporary demo-cards within 1 second.

**Independent Test**: Start a drag, release outside any valid drop target, and confirm the temporary demo-card is removed within 1 second.

### Implementation for User Story 2

- [X] T007 [US2] Invoke shared cleanup helper on drag abort/cancel in `src/main.ts`
- [X] T008 [US2] Clear or reconcile any pending cleanup timers after abort handling in `src/main.ts`

**Checkpoint**: User Story 2 should be functional and testable independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T009 Run manual demo verification steps in `specs/004-fix-demo-card-cleanup/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - no dependencies on other stories

### Parallel Opportunities

- No parallel tasks identified; changes are concentrated in `src/main.ts`

---

## Parallel Example: User Story 1

```bash
# No parallel tasks for User Story 1 due to single-file scope in src/main.ts
```

---

## Parallel Example: User Story 2

```bash
# No parallel tasks for User Story 2 due to single-file scope in src/main.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo
3. Add User Story 2 → Test independently → Demo

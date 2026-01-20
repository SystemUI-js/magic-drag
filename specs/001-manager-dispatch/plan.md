# Implementation Plan: [FEATURE]

**Branch**: `001-manager-dispatch` | **Date**: 2026-01-20 | **Spec**: `/specs/001-manager-dispatch/spec.md`
**Input**: Feature specification from `/specs/001-manager-dispatch/spec.md`

## Summary

Refactor MagicDragManager so it only recognizes signal types and dispatches via a global event-listener model instead of case-by-case methods, while letting each MagicDrag subclass declare its channel name and updating activeTabId on drag start and enter-tab transitions.

## Technical Context

**Language/Version**: TypeScript ~5.6.3  
**Primary Dependencies**: @system-ui-js/multi-drag, @system-ui-js/development-base, BroadcastChannel API  
**Storage**: N/A  
**Testing**: Jest + ts-jest  
**Target Platform**: Modern browsers with BroadcastChannel support
**Project Type**: single (library)  
**Performance Goals**: maintain smooth drag updates (~60fps) with minimal dispatch overhead  
**Constraints**: cross-tab messaging must be resilient with zero handlers; no DOM writes by manager beyond existing preview flow  
**Scale/Scope**: single library module (src/magic-drag)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Principles defined in `.specify/memory/constitution.md`.
- Compliance: Plan stays within library boundaries, enforces event-driven dispatch,
  and keeps type safety/observability requirements in scope.

## Project Structure

### Documentation (this feature)

```text
specs/001-manager-dispatch/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── magic-drag/
│   ├── MagicDrag.ts
│   ├── MagicDragManager.ts
│   ├── index.ts
│   └── types.ts
└── __tests__/
    └── magic-drag.test.ts
```

**Structure Decision**: Single project library layout rooted at `src/magic-drag` with Jest tests under `src/__tests__`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

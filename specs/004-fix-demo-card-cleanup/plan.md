# Implementation Plan: Fix Demo Card Cleanup

**Branch**: `004-fix-demo-card-cleanup` | **Date**: 2026-01-23 | **Spec**: `/home/zhangxiao/frontend/SysUI/magic-drag/specs/004-fix-demo-card-cleanup/spec.md`
**Input**: Feature specification from `/specs/004-fix-demo-card-cleanup/spec.md`

## Summary

Ensure demo-only temporary cards created during drag operations are removed on drag end or abort, including cross-tab flows, by using existing runtime tracking and cleanup events so the demo canvas stays clean within one second.

## Technical Context

**Language/Version**: TypeScript 5.6.3
**Primary Dependencies**: `@system-ui-js/multi-drag`, `@system-ui-js/development-base`, BroadcastChannel API, Vite
**Storage**: N/A (in-memory DOM/runtime state only)
**Testing**: Jest + ts-jest (jsdom)
**Target Platform**: Modern browsers (BroadcastChannel-supported)
**Project Type**: Single web demo + library source in `src/`
**Performance Goals**: Cleanup visible artifacts within 1s of drag end (per spec)
**Constraints**: No `any`, keep demo cleanup event-driven, avoid touching `node_modules`
**Scale/Scope**: Small demo surface (single page, handful of cards)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Library-First, Clear Boundaries: PASS (cleanup confined to demo runtime handling, no cross-layer coupling)
- II. Type Safety First: PASS (existing typed payloads and runtime types, no `any`)
- III. Event-Driven Extensibility: PASS (cleanup triggered by drag events and demo channel signals)
- IV. Testing Discipline: PASS (spec does not mandate tests; manual demo verification in quickstart)
- V. Observability & Diagnostics: PASS (demo event log already captures drag lifecycle)
- Engineering Constraints: PASS (no `node_modules` changes, no `.history` usage)

Post-Phase 1 Re-check: PASS (design artifacts stay within demo scope, no new violations)

## Project Structure

### Documentation (this feature)

```text
specs/004-fix-demo-card-cleanup/
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
├── main.ts
├── magic-drag/
│   ├── MagicDrag.ts
│   ├── MagicDragManager.ts
│   ├── index.ts
│   └── types.ts
└── __tests__/
    └── magic-drag.test.ts
```

**Structure Decision**: Single project layout; demo logic in `src/main.ts` with library sources under `src/magic-drag/` and tests in `src/__tests__/`.

## Complexity Tracking

No constitution violations requiring justification.

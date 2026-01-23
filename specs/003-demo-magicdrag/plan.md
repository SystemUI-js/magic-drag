# Implementation Plan: Demo MagicDrag 展示完善

**Branch**: `003-demo-magicdrag` | **Date**: 2026-01-23 | **Spec**: /home/zhangxiao/frontend/SysUI/magic-drag/specs/003-demo-magicdrag/spec.md
**Input**: Feature specification from `/specs/003-demo-magicdrag/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

完善 demo：拖拽开始即广播并在所有 Tab 实例化卡片；非源 Tab 结束时通知源 Tab 销毁实例；通过事件日志面板展示 MagicDrag 基类方法与事件结果，并修复重复拖拽/异常结束的残留问题。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.6.3  
**Primary Dependencies**: @system-ui-js/multi-drag, BroadcastChannel API, @system-ui-js/development-base  
**Storage**: N/A（内存态）  
**Testing**: Jest (jsdom)  
**Target Platform**: 现代浏览器（支持 BroadcastChannel，同源多 Tab）
**Project Type**: 单项目（库 + demo，Vite）  
**Performance Goals**: 拖拽交互 60 fps、跨 Tab 通知低延迟  
**Constraints**: 不新增依赖、不引入 any；BroadcastChannel 仅同源可用  
**Scale/Scope**: demo 级别，少量卡片与少量 Tab

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Library-First, Clear Boundaries: 仅在 demo 侧补齐展示与逻辑，不改变库职责边界。PASS
- II. Type Safety First: 新增/调整仅用显式类型与泛型，不引入 any。PASS
- III. Event-Driven Extensibility: 复用现有事件分发与回调扩展点驱动 demo 行为。PASS
- IV. Testing Discipline (Contextual): 规格未要求新增测试，demo 变更不触及核心库测试。PASS
- V. Observability & Diagnostics: 通过事件日志面板展示关键事件/参数。PASS

**Post-Design Re-check**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── magic-drag/
│   ├── MagicDrag.ts
│   ├── MagicDragManager.ts
│   ├── types.ts
│   └── index.ts
├── __tests__/
│   └── magic-drag.test.ts
└── main.ts
```

**Structure Decision**: 单库结构，demo 入口为 `src/main.ts`，核心库代码在 `src/magic-drag/`，测试在 `src/__tests__/`。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

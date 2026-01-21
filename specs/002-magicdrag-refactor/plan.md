# Implementation Plan: MagicDrag API Decoupling

**Branch**: `002-magicdrag-refactor` | **Date**: 2026-01-21 | **Spec**: /home/zhangxiao/frontend/SysUI/magic-drag/specs/002-magicdrag-refactor/spec.md
**Input**: Feature specification from `/specs/002-magicdrag-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

解耦 MagicDrag 与 Manager：Manager 通过注册子类获取静态 channelName 并调用可选扩展点（静态 onEnterTab 与实例 onOtherTabDrag*），未实现时安全跳过；跨 Tab 消息需按 className 分发并记录未注册类型。

## Technical Context

**Language/Version**: TypeScript 5.6.3
**Primary Dependencies**: @system-ui-js/multi-drag, BroadcastChannel API, @system-ui-js/development-base
**Storage**: N/A
**Testing**: Jest
**Target Platform**: Modern browsers (BroadcastChannel 支持)
**Project Type**: single library package
**Performance Goals**: 跨 Tab 回调 1s 内触发
**Constraints**: BroadcastChannel 不可用时降级为单 Tab 行为
**Scale/Scope**: 单库、跨 Tab 拖拽事件分发

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Library-First, Clear Boundaries: Manager 仅做协调/分发，MagicDrag 子类保持序列化与 DOM 归属，满足职责边界。
- II. Type Safety First: 公共 API 与事件负载显式类型，禁止 any 与不安全断言。
- III. Event-Driven Extensibility: 通过注册表按 className/channelName 分发事件，避免硬编码分支。
- IV. Testing Discipline: spec 含用户场景，后续 tasks 必须补充/更新测试覆盖核心流程。
- V. Observability & Diagnostics: 未注册 className 与通道不可用需记录包含 className/channelName 的诊断信息。

Re-check (post Phase 1): 设计产物已明确实体/契约与 quickstart，未引入与原则冲突的设计。
## Project Structure

### Documentation (this feature)

```text
specs/002-magicdrag-refactor/
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
│   ├── index.ts
│   ├── types.ts
│   ├── MagicDrag.ts
│   └── MagicDragManager.ts
└── __tests__/
    └── magic-drag.test.ts
```

**Structure Decision**: 单库结构，核心逻辑在 `src/magic-drag/`，测试在 `src/__tests__/`。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

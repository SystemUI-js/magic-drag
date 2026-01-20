<!--
Sync Impact Report:
- Version change: 1.0.1 → 1.0.2
- Modified principles: None
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅
  - .specify/templates/spec-template.md ✅
  - .specify/templates/tasks-template.md ✅
  - .specify/templates/agent-file-template.md ✅
  - .specify/templates/checklist-template.md ✅
- Follow-up TODOs: None
-->
# Magic Drag Constitution

## Core Principles

### I. Library-First, Clear Boundaries
Each module MUST have a single, explicit responsibility and avoid hidden side
-effects. The manager layer MUST focus on coordination and dispatch, while
serialization/deserialization and DOM ownership stay with MagicDrag subclasses.
This keeps the library composable and testable.

### II. Type Safety First
TypeScript types MUST be explicit for public APIs and event payloads. Avoid
unsafe casts and prefer precise generics. Any change that weakens type safety
requires documented justification and reviewer approval.

### III. Event-Driven Extensibility
New behavior MUST be added through event registration and dispatch rather than
hard-coded branching. Event systems MUST allow filtering by channel, type, and
instance ID to prevent cross-talk.

### IV. Testing Discipline (Contextual)
Tests MUST be added when the feature specification requests them. For behavioral
changes that affect core flows, existing tests MUST be updated or extended to
cover the new behavior. Do not remove tests to make failures disappear.

### V. Observability & Diagnostics
Unhandled or unexpected signals MUST be observable (structured logs or counters).
Errors SHOULD surface actionable context such as message type, channel, and
instance ID.

## Engineering Constraints

- TypeScript is the source of truth; do not introduce `any` in new code.
- Do not edit files under `node_modules/`.
- Avoid writing to `.history/` or relying on its contents.
- Prefer existing project dependencies over adding new ones.

## Workflow & Quality Gates

- Lint and type-check MUST pass before release-quality changes are accepted.
- Update the CHANGELOG under `[UnReleased]` before pushing changes that modify
  behavior or public APIs.
- All changes MUST reference a feature spec or task plan when applicable.

## Governance

The constitution supersedes local conventions. Amendments require a written
rationale, version bump, and review. Versioning follows semantic versioning:
MAJOR for breaking governance changes, MINOR for new or expanded principles,
PATCH for clarifications. Compliance checks must be performed during plan
reviews and before merging.

**Version**: 1.0.2 | **Ratified**: 2025-01-20 | **Last Amended**: 2025-01-20

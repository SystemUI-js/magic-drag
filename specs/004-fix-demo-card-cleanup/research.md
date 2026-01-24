# Phase 0 Research

## Decisions

### Demo cleanup event flow
- Decision: Keep cleanup in demo runtime layer (`src/main.ts`) using existing drag event listeners and demo-only BroadcastChannel signals.
- Rationale: Matches library-first boundaries and keeps demo behavior isolated while using existing MagicDrag events.
- Alternatives considered: Core library auto-cleanup for demo cards (rejected because it would couple demo-specific DOM logic into library core).

### Cross-tab cleanup signal
- Decision: Continue using the demo-specific `demo_destroy` BroadcastChannel message to request source-tab cleanup after drop.
- Rationale: Avoids modifying MagicDrag transport and keeps demo-specific cleanup explicit.
- Alternatives considered: Reusing MagicDragMessage types for demo cleanup (rejected to avoid changing library protocol for a demo-only need).

### Drag abort handling
- Decision: Ensure abort cleanup uses existing runtime cleanup helpers to remove preview/dragging demo cards within 1 second.
- Rationale: Aligns with spec FR-002/FR-004 and current event-driven flow.
- Alternatives considered: Timed polling cleanup (rejected due to unnecessary complexity and reduced determinism).

## External Notes

- BroadcastChannel cleanup best practice: close channels when no longer needed (MDN).
- Event listener cleanup best practice: remove listeners or use abort controllers to avoid leaks.

# Feature Specification: Fix Demo Card Cleanup

**Feature Branch**: `004-fix-demo-card-cleanup`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "使用 编号 004。在 body 下的那个 demo-card 在拖拽完成后没有清理成功"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag Completion Cleans Temporary Card (Priority: P1)

When I finish a drag in the demo, the temporary demo-card that appears under the page body disappears so the demo canvas stays clean.

**Why this priority**: The leftover card is visible after every drag, so it directly affects the primary demo experience.

**Independent Test**: Can be fully tested by dragging any demo card and verifying the temporary body-level card is removed after completion.

**Acceptance Scenarios**:

1. **Given** a demo card is dragged and dropped in the same tab, **When** the drag ends, **Then** no temporary demo-card remains under the body.
2. **Given** a demo card is dragged into another tab and dropped, **When** the drop completes, **Then** the temporary demo-card in the source tab is removed.

---

### User Story 2 - Cancelled Drags Also Clean Up (Priority: P2)

When I cancel or abort a drag, the temporary demo-card is cleaned up so there are no stray cards left behind.

**Why this priority**: Users often abort drags; cleanup must still happen to prevent visual clutter.

**Independent Test**: Can be tested by starting a drag and releasing outside any valid drop target, then checking for leftover demo-card elements.

**Acceptance Scenarios**:

1. **Given** a demo card drag is aborted outside any tab, **When** the drag ends, **Then** the temporary demo-card is removed.

### Edge Cases

- Drag end fires after a tab switch and the temporary demo-card has already been marked for removal.
- Multiple drags in a row complete quickly; no extra temporary demo-card elements remain afterward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove any temporary demo-card created under the page body when a drag completes successfully.
- **FR-002**: System MUST remove any temporary demo-card when a drag is aborted or cancelled.
- **FR-003**: System MUST ensure only the intended persistent demo cards remain visible after any drag ends.
- **FR-004**: System MUST complete cleanup within 1 second of drag completion to avoid visible artifacts.

### Assumptions

- The issue affects only temporary demo cards created during drag interactions, not the original cards in the demo grid.
- The cleanup behavior is expected to be consistent across single-tab and cross-tab drag flows.

### Dependencies

- The demo page continues to provide the drag interactions used to create temporary demo cards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After 20 consecutive drag completions, there are zero temporary demo-card elements left under the body.
- **SC-002**: Cleanup completes within 1 second in 95% of drag completions observed during manual testing.
- **SC-003**: Users can complete cross-tab drag and drop without seeing leftover cards in any tab.

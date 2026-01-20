# Data Model

## Entities

### DragType
- name: string
- channelName: string
- className: string
- constructor: MagicDragConstructor

### SignalChannel
- name: string
- dragTypes: DragType[]

### ActiveTabState
- activeTabId: string | null
- sourceTabId: string | null
- draggingInstanceId: string | null

## Relationships
- DragType uses SignalChannel by channelName.
- SignalChannel can be shared by multiple DragType entries.
- ActiveTabState is maintained by MagicDragManager and updated on drag start and
  enter-tab transitions.

## Validation Rules
- channelName MUST be a non-empty string.
- dragTypes may share the same channelName (no uniqueness requirement).
- activeTabId MUST be set on drag start and updated on enter-tab events.

## State Transitions
- idle → dragging: on DRAG_START (activeTabId = sourceTabId)
- dragging → entered-target: on DRAG_ENTER_TAB (activeTabId = targetTabId)
- dragging/entered-target → idle: on DRAG_END/DRAG_ABORT/DRAG_DROP

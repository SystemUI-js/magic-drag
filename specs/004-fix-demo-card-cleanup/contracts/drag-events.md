# Demo Drag Event Contracts

## MagicDrag Events (BroadcastChannel)

### DRAG_END
- Type: `magic_drag_end`
- Payload:
  - serializedData: SerializedData<CardData>
  - screenPosition?: ScreenPosition
- Notes: Target tabs remove preview/dragging runtime cards for this instance.

### DRAG_ABORT
- Type: `magic_drag_abort`
- Payload:
  - serializedData: SerializedData<CardData>
  - screenPosition?: ScreenPosition
- Notes: Target tabs remove preview/dragging runtime cards for this instance.

### DRAG_DROP
- Type: `magic_drag_drop`
- Payload:
  - serializedData: SerializedData<CardData>
  - screenPosition?: ScreenPosition
  - targetTabId: string
- Notes: Target tab creates dropped instance and requests source cleanup.

## Demo Cleanup Signal (BroadcastChannel)

### demo_destroy
- Type: `demo_destroy`
- Payload:
  - instanceId: string
  - sourceTabId: string
  - targetTabId: string
  - timestamp: number
- Notes: Source tab removes the runtime card matching instanceId.

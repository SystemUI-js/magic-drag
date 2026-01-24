# Phase 1 Data Model

## Entities

### DemoCard
- Description: Demo drag card instance rendered in the demo canvas.
- Fields:
  - instanceId: string (unique per card instance)
  - title: string
  - content: string
  - color: string
  - dragOffset: { x: number, y: number }

### CardRuntime
- Description: Runtime tracking record for demo cards (local and external).
- Fields:
  - externalId: string (serialized instance id)
  - localId: string (local DemoCard instance id)
  - instance: DemoCard
  - element: HTMLElement
  - originTabId: string
  - currentTabId: string
  - status: 'idle' | 'dragging' | 'preview' | 'dropped' | 'destroyed'
  - lastUpdatedAt: number (epoch ms)
  - lastSerialized: SerializedData<CardData>

## Relationships

- DemoCard 1:1 CardRuntime (runtime tracks a single card instance)
- CardRuntime references the originating tab and current tab for cleanup decisions

## State Transitions

- idle -> dragging (drag start)
- dragging -> preview (leave tab)
- preview -> dragging (enter tab)
- dragging/preview -> dropped (drop completes)
- preview/dragging -> destroyed (drag end or abort cleanup)

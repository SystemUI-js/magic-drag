# Quickstart

## Goal
Refactor MagicDragManager to dispatch signals via event listeners, use per-class
channel names, and correctly update activeTabId during drag lifecycle.

## Prerequisites
- Node.js + Yarn
- TypeScript

## Common Commands

```bash
yarn test
yarn type-check
yarn lint
```

## Validation Checklist
- Verify registering a listener receives DRAG_START events with correct payload.
- Verify multiple drag types sharing a channel can filter by class name.
- Verify activeTabId updates on drag start and on enter-tab events.
- Verify no crash when no listeners are registered.
- Verify listeners can filter by channel name.

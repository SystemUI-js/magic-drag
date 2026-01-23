# Data Model: Demo MagicDrag 展示完善

## Entities

### Card
- **Fields**:
  - `id`: string (唯一标识，非空)
  - `title`: string
  - `content`: string
  - `originTabId`: string (源 Tab 标识)
  - `currentTabId`: string (当前 Tab 标识)
  - `status`: `idle | dragging | preview | dropped | destroyed`
- **Validation**:
  - `id` 必须唯一且不可为空
  - `originTabId` 与 `currentTabId` 不可为空
- **Relationships**:
  - `originTabId`/`currentTabId` → `TabSession.tabId`

### TabSession
- **Fields**:
  - `tabId`: string (唯一标识，非空)
  - `isSource`: boolean
  - `lastSeenAt`: number (时间戳，毫秒)
- **Validation**:
  - `tabId` 必须唯一且不可为空

### DragEvent
- **Fields**:
  - `id`: string (事件 ID)
  - `cardId`: string
  - `type`: `DRAG_START | DRAG_MOVE | DRAG_END | DRAG_ENTER_TAB | DRAG_LEAVE_TAB | DRAG_DROP | DRAG_ABORT`
  - `screenPosition`: `{ x: number; y: number }`
  - `dragOffset`: `{ x: number; y: number }`
  - `serializedData`: object (仅在开始/放置/结束事件携带)
- **Validation**:
  - `type` 必须为枚举值
  - `screenPosition`/`dragOffset` 必须为有限数值

### EventLogEntry
- **Fields**:
  - `id`: string (日志唯一标识)
  - `tabId`: string (触发所在 Tab)
  - `instanceId`: string (卡片实例 ID)
  - `method`: string (MagicDrag 基类方法或事件名)
  - `timestamp`: number (毫秒时间戳)
  - `summary`: string (关键参数摘要)
- **Validation**:
  - `id`、`tabId`、`instanceId` 不可为空
  - `timestamp` 必须为有限数值

## State Transitions

### Card.status
`idle` → `dragging` → (`preview` | `dropped`) → `destroyed`

### Drag Flow
- `DRAG_START`: 生成/标记卡片为 `dragging`，广播给所有 Tab
- `DRAG_ENTER_TAB`: 目标 Tab 标记为 `preview`
- `DRAG_DROP`/`DRAG_END`: 目标 Tab 标记为 `dropped`，源 Tab 标记 `destroyed`
- `DRAG_ABORT`: 清理所有临时实例并标记 `destroyed`

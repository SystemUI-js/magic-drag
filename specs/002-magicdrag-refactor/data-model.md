# Data Model

## Entity: MagicDrag 子类
- Fields:
  - className: string（静态标识，注册 key）
  - channelName: string（静态，用于跨 Tab 通信）
  - onEnterTab?: (payload) => void（静态扩展点）
  - onOtherTabDragStart?: (payload) => void（实例扩展点）
  - onOtherTabDragMove?: (payload) => void（实例扩展点）
  - onOtherTabDragEnd?: (payload) => void（实例扩展点）
- Relationships:
  - 由 Manager 注册并与 channelName 绑定

## Entity: Manager 注册表
- Fields:
  - classesByName: Map<string, MagicDragConstructor>
  - classNameByChannel: Map<string, string>
  - instancesByClassName: Map<string, Set<MagicDrag>>
- Validation Rules:
  - channelName 必须唯一（冲突拒绝注册）
  - 未注册 className 的消息必须被忽略并记录 warning

## Entity: 跨 Tab 拖拽事件
- Fields:
  - type: DRAG_START | DRAG_MOVE | DRAG_END | DRAG_ENTER_TAB
  - className: string
  - payload: serialized data + screenPosition + dragOffset
- State Transitions:
  - DRAG_START → DRAG_MOVE* → DRAG_END
  - DRAG_ENTER_TAB（独立触发）

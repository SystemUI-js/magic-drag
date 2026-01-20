/**
 * MagicDrag 类型定义文件
 * 定义跨 Tab 拖拽功能所需的所有类型
 */

import type { Pose } from '@system-ui-js/multi-drag'

/**
 * 跨 Tab 通信消息类型枚举
 */
export enum MagicDragMessageType {
  /** 开始拖拽 */
  DRAG_START = 'magic_drag_start',
  /** 拖拽移动中 */
  DRAG_MOVE = 'magic_drag_move',
  /** 拖拽结束 */
  DRAG_END = 'magic_drag_end',
  /** 拖拽进入目标 Tab */
  DRAG_ENTER_TAB = 'magic_drag_enter_tab',
  /** 拖拽离开源 Tab */
  DRAG_LEAVE_TAB = 'magic_drag_leave_tab',
  /** 在目标 Tab 中放置 */
  DRAG_DROP = 'magic_drag_drop',
  /** 拖拽中止（拖到所有 Tab 外松手） */
  DRAG_ABORT = 'magic_drag_abort',
  /** Tab 激活通知 */
  TAB_ACTIVATED = 'magic_drag_tab_activated',
  /** 心跳检测 */
  HEARTBEAT = 'magic_drag_heartbeat',
  /** 心跳响应 */
  HEARTBEAT_ACK = 'magic_drag_heartbeat_ack'
}

/**
 * 屏幕坐标位置
 */
export interface ScreenPosition {
  /** 屏幕 X 坐标 */
  screenX: number
  /** 屏幕 Y 坐标 */
  screenY: number
}

/**
 * 拖拽偏移量
 * 记录拖拽开始时鼠标相对于元素左上角的偏移
 */
export interface DragOffset {
  /** X 方向偏移 */
  x: number
  /** Y 方向偏移 */
  y: number
}

/**
 * 序列化数据结构
 * 用于在 Tab 之间传输 MagicDrag 实例状态
 */
export interface SerializedData<T = unknown> {
  /** MagicDrag 实例唯一标识 */
  instanceId: string
  /** 子类名称，用于反序列化时找到正确的构造函数 */
  className: string
  /** 元素位姿信息 */
  pose: Pose
  /** 子类自定义数据 */
  customData: T
  /** 拖拽偏移量（可选，用于跨 Tab 时保持鼠标与元素的相对位置） */
  dragOffset?: DragOffset
}

/**
 * 跨 Tab 通信消息结构
 */
export interface MagicDragMessage<T = unknown> {
  /** 消息类型 */
  type: MagicDragMessageType
  /** MagicDrag 实例唯一标识 */
  instanceId: string
  /** 源 Tab 唯一标识 */
  sourceTabId: string
  /** 目标 Tab 唯一标识（可选，用于定向消息） */
  targetTabId?: string
  /** 消息负载 */
  payload: MagicDragMessagePayload<T>
}

/**
 * 消息负载结构
 */
export interface MagicDragMessagePayload<T = unknown> {
  /** 序列化数据（可选） */
  serializedData?: SerializedData<T>
  /** 屏幕坐标位置（可选） */
  screenPosition?: ScreenPosition
  /** 时间戳 */
  timestamp: number
}

/**
 * MagicDrag 配置选项
 */
export interface MagicDragOptions {
  /** BroadcastChannel 名称，默认 'magic-drag-channel' */
  channelName?: string
  /** 是否启用惯性拖拽，默认 false */
  inertial?: boolean
  /** 预览元素的容器，默认 document.body */
  previewContainer?: HTMLElement
  /** 预览元素的 z-index，默认 9999 */
  previewZIndex?: number
  /** 预览元素的透明度，默认 0.7 */
  previewOpacity?: number
}

/**
 * MagicDragManager 配置选项
 */
export interface MagicDragManagerOptions {
  /** BroadcastChannel 名称，默认 'magic-drag-channel' */
  channelName?: string
  /** 预览元素的容器，默认 document.body */
  previewContainer?: HTMLElement
  /** 心跳检测间隔（毫秒），默认 5000 */
  heartbeatInterval?: number
  /** Tab 超时时间（毫秒），默认 15000 */
  tabTimeout?: number
}

/**
 * Tab 信息
 */
export interface TabInfo {
  /** Tab 唯一标识 */
  tabId: string
  /** 最后活跃时间 */
  lastActiveTime: number
  /** 是否在线 */
  isOnline: boolean
}

/**
 * 拖拽状态
 */
export interface DragState<T = unknown> {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 正在拖拽的实例 ID */
  draggingInstanceId: string | null
  /** 源 Tab ID */
  sourceTabId: string | null
  /** 当前激活的目标 Tab ID（鼠标进入的 Tab） */
  activeTabId: string | null
  /** 序列化数据 */
  serializedData: SerializedData<T> | null
  /** 最后的屏幕位置 */
  lastScreenPosition: ScreenPosition | null
}

/**
 * 预览元素信息
 */
export interface PreviewInfo {
  /** 预览元素 */
  element: HTMLElement
  /** 关联的实例 ID */
  instanceId: string
  /** 创建时间 */
  createdAt: number
}

export type MagicDragConstructor<T extends MagicDragBase = MagicDragBase> =
  (new (element: HTMLElement, ...args: never[]) => T) & {
    channelName?: string
  }

/**
 * MagicDrag 基类接口
 * 用于类型约束，不直接使用
 */
export interface MagicDragBase {
  /** 实例唯一标识 */
  readonly instanceId: string
  /** 关联的 HTML 元素 */
  readonly element: HTMLElement
  /** 序列化实例状态 */
  serialize(): SerializedData
  /** 从序列化数据恢复实例状态 */
  deserialize(data: SerializedData): void
  /** 销毁实例 */
  destroy(): void
}

/**
 * 事件监听器类型
 */
export type MagicDragEventListener<T = MagicDragMessage> = (message: T) => void

export interface MagicDragEventListenerOptions {
  channelName?: string
}

/**
 * 事件类型映射
 */
export interface MagicDragEventMap {
  [MagicDragMessageType.DRAG_START]: MagicDragMessage
  [MagicDragMessageType.DRAG_MOVE]: MagicDragMessage
  [MagicDragMessageType.DRAG_END]: MagicDragMessage
  [MagicDragMessageType.DRAG_ENTER_TAB]: MagicDragMessage
  [MagicDragMessageType.DRAG_LEAVE_TAB]: MagicDragMessage
  [MagicDragMessageType.DRAG_DROP]: MagicDragMessage
  [MagicDragMessageType.DRAG_ABORT]: MagicDragMessage
  [MagicDragMessageType.TAB_ACTIVATED]: MagicDragMessage
  [MagicDragMessageType.HEARTBEAT]: MagicDragMessage
  [MagicDragMessageType.HEARTBEAT_ACK]: MagicDragMessage
}

export interface MagicDragEventListenerEntry<
  EventType extends MagicDragMessageType
> {
  listener: MagicDragEventListener<MagicDragMessage>
  originalListener: MagicDragEventListener<MagicDragEventMap[EventType]>
  channelName?: string
  type: EventType
}

export type MagicDragEventListenerStore = Map<
  MagicDragMessageType,
  Set<MagicDragEventListenerEntry<MagicDragMessageType>>
>

export type MagicDragAnyEventListenerStore = MagicDragEventListenerStore

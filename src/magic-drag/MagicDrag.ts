import {
  Drag,
  DragOperationType,
  defaultGetPose,
  type Pose
} from '@system-ui-js/multi-drag'
import { MagicDragManager } from './MagicDragManager'
import type {
  DragOffset,
  MagicDragOptions,
  ScreenPosition,
  SerializedData
} from './types'

/**
 * 生成 UUID
 * 优先使用 crypto.randomUUID()，如果不支持则回退到其他方法
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return (
      hex.substring(0, 8) +
      '-' +
      hex.substring(8, 12) +
      '-' +
      '4' +
      hex.substring(13, 16) +
      '-' +
      (((hex.substring(16, 17).charCodeAt(0) ?? 0) % 4) + 8).toString(16) +
      hex.substring(17, 20) +
      '-' +
      hex.substring(20, 32)
    )
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export abstract class MagicDrag<T = unknown> {
  readonly instanceId: string = generateUUID()
  readonly element: HTMLElement

  protected drag: Drag
  protected manager: MagicDragManager
  protected options: MagicDragOptions

  private isDragging = false
  private hasLeftTab = false
  private dragOffset: DragOffset = { x: 0, y: 0 }
  private lastScreenPosition: ScreenPosition | null = null

  constructor(element: HTMLElement, options: MagicDragOptions = {}) {
    this.element = element
    this.options = options
    this.manager = MagicDragManager.getInstance({
      channelName: options.channelName,
      previewContainer: options.previewContainer
    })

    this.drag = new Drag(element, {
      inertial: options.inertial ?? false
    })

    this.setupDragEvents()
    this.manager.registerInstance(this)
  }

  abstract serialize(): SerializedData<T>

  abstract deserialize(data: SerializedData<T>): void

  protected abstract getClassName(): string

  protected getCurrentPose(): Pose {
    return defaultGetPose(this.element)
  }

  protected createSerializedData(customData: T): SerializedData<T> {
    return {
      instanceId: this.instanceId,
      className: this.getClassName(),
      pose: this.getCurrentPose(),
      customData,
      dragOffset: this.dragOffset
    }
  }

  private setupDragEvents(): void {
    this.drag.addEventListener(DragOperationType.Start, (fingers) => {
      this.handleDragStart(fingers)
    })

    this.drag.addEventListener(DragOperationType.Move, (fingers) => {
      this.handleDragMove(fingers)
    })

    this.drag.addEventListener(DragOperationType.End, () => {
      this.handleDragEnd()
    })
  }

  private handleDragStart(fingers: unknown[]): void {
    this.isDragging = true
    this.hasLeftTab = false

    const firstFinger = fingers[0]
    if (
      firstFinger &&
      typeof firstFinger === 'object' &&
      'getLastOperation' in firstFinger
    ) {
      const lastStart = (
        firstFinger as {
          getLastOperation?: () => { point: { x: number; y: number } }
        }
      )?.getLastOperation?.()
      if (lastStart?.point) {
        const rect = this.element.getBoundingClientRect()
        this.dragOffset = {
          x: lastStart.point.x - rect.left,
          y: lastStart.point.y - rect.top
        }
        this.lastScreenPosition = {
          screenX: window.screenX + lastStart.point.x,
          screenY: window.screenY + lastStart.point.y
        }
      }
    }

    const serializedData = this.serialize()
    this.manager.notifyDragStart(this.instanceId, serializedData)

    const screenPosition =
      this.lastScreenPosition ?? this.getScreenPosition(fingers)
    this.onDragStart(screenPosition)
  }

  private handleDragMove(fingers: unknown[]): void {
    if (!this.isDragging) {
      return
    }

    const screenPosition = this.getScreenPosition(fingers)
    const isLeaveTab = this.isPositionOutsideViewport(screenPosition)
    const serializedData = this.serialize()

    this.lastScreenPosition = screenPosition
    this.manager.notifyDragMove(this.instanceId, screenPosition, serializedData)

    if (isLeaveTab && !this.hasLeftTab) {
      this.hasLeftTab = true
      this.onLeaveTab(screenPosition)
    } else if (!isLeaveTab && this.hasLeftTab) {
      this.hasLeftTab = false
      this.onEnterTab(screenPosition)
    }

    this.onDragMove(screenPosition, isLeaveTab)
  }

  private handleDragEnd(): void {
    if (!this.isDragging) {
      return
    }

    const serializedData = this.serialize()
    const dragState = this.manager.getDragState()
    console.log('[handleDragEnd] dragState: ', dragState)
    const screenPosition = this.lastScreenPosition ?? this.getScreenPosition()

    if (
      this.hasLeftTab &&
      dragState.activeTabId &&
      dragState.activeTabId !== this.manager.tabId
    ) {
      this.manager.notifyDragDrop(
        this.instanceId,
        serializedData,
        dragState.activeTabId
      )
      this.isDragging = false
      this.hasLeftTab = false
      this.destroy()
      return
    }

    if (this.hasLeftTab && !dragState.activeTabId) {
      this.manager.notifyDragAbort(this.instanceId, serializedData)
      this.isDragging = false
      this.hasLeftTab = false
      this.onAbort(screenPosition)
      return
    }

    const isLeaveTab = this.hasLeftTab
    this.manager.notifyDragEnd(this.instanceId, serializedData)
    this.isDragging = false
    this.hasLeftTab = false

    this.onDragEnd(screenPosition, isLeaveTab)
  }

  private getScreenPosition(fingers: unknown[] = []): ScreenPosition {
    const firstFinger = fingers[0]
    if (
      firstFinger &&
      typeof firstFinger === 'object' &&
      'getLastOperation' in firstFinger
    ) {
      const lastMove = (
        firstFinger as {
          getLastOperation?: () => { point: { x: number; y: number } }
        }
      )?.getLastOperation?.()
      if (lastMove?.point) {
        return {
          screenX: window.screenX + lastMove.point.x,
          screenY: window.screenY + lastMove.point.y
        }
      }
    }

    const rect = this.element.getBoundingClientRect()
    return {
      screenX: window.screenX + rect.left + rect.width / 2,
      screenY: window.screenY + rect.top + rect.height / 2
    }
  }

  private isPositionOutsideViewport(screenPosition: ScreenPosition): boolean {
    const clientX = screenPosition.screenX - window.screenX
    const clientY = screenPosition.screenY - window.screenY

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const margin = 10

    return (
      clientX < margin ||
      clientX > viewportWidth - margin ||
      clientY < margin ||
      clientY > viewportHeight - margin
    )
  }

  protected onDragStart(_screenPosition: ScreenPosition): void {}

  protected onDragMove(
    _screenPosition: ScreenPosition,
    _isLeaveTab: boolean
  ): void {}

  protected onDragEnd(
    _screenPosition: ScreenPosition,
    _isLeaveTab: boolean
  ): void {}

  protected onAbort(_screenPosition: ScreenPosition): void {}

  protected onLeaveTab(_screenPosition: ScreenPosition): void {}

  protected onEnterTab(_screenPosition: ScreenPosition): void {}

  destroy(): void {
    this.drag.setDisabled()
    this.manager.unregisterInstance(this.instanceId)
    this.element.remove()
  }
}

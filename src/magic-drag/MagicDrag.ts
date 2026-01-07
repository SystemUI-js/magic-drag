import { Drag, DragOperationType, defaultGetPose, type Pose } from '@system-ui-js/multi-drag'
import { MagicDragManager } from './MagicDragManager'
import type { DragOffset, MagicDragOptions, ScreenPosition, SerializedData } from './types'

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
  private isHidden = false

  constructor(element: HTMLElement, options: MagicDragOptions = {}) {
    this.element = element
    this.options = options
    this.manager = MagicDragManager.getInstance({
      channelName: options.channelName,
      previewContainer: options.previewContainer,
    })

    this.drag = new Drag(element, {
      inertial: options.inertial ?? false,
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
      dragOffset: this.dragOffset,
    }
  }

  private setupDragEvents(): void {
    this.drag.addEventListener(DragOperationType.Start, (fingers) => {
      this.handleDragStart(fingers)
    })

    this.drag.addEventListener(DragOperationType.Move, () => {
      this.handleDragMove()
    })

    this.drag.addEventListener(DragOperationType.End, () => {
      this.handleDragEnd()
    })
  }

  private handleDragStart(fingers: unknown[]): void {
    this.isDragging = true
    this.hasLeftTab = false
    this.isHidden = false

    const firstFinger = fingers[0]
    if (firstFinger && typeof firstFinger === 'object' && 'getLastOperation' in firstFinger) {
      const lastStart = (
        firstFinger as { getLastOperation?: () => { point: { x: number; y: number } } }
      )?.getLastOperation?.()
      if (lastStart?.point) {
        const rect = this.element.getBoundingClientRect()
        this.dragOffset = {
          x: lastStart.point.x - rect.left,
          y: lastStart.point.y - rect.top,
        }
      }
    }

    const serializedData = this.serialize()
    this.manager.notifyDragStart(this.instanceId, serializedData)

    this.onDragStart()
  }

  private handleDragMove(): void {
    if (!this.isDragging) {
      return
    }

    const screenPosition = this.getScreenPosition()
    const serializedData = this.serialize()

    this.manager.notifyDragMove(this.instanceId, screenPosition, serializedData)

    const isOutsideViewport = this.isPositionOutsideViewport(screenPosition)

    if (isOutsideViewport && !this.hasLeftTab) {
      this.hasLeftTab = true
      this.onLeaveTab()
    } else if (!isOutsideViewport && this.hasLeftTab) {
      this.hasLeftTab = false
      this.onEnterTab()
    }

    this.onDragMove(screenPosition)
  }

  private handleDragEnd(): void {
    if (!this.isDragging) {
      return
    }

    const serializedData = this.serialize()
    const dragState = this.manager.getDragState()

    if (this.hasLeftTab && dragState.activeTabId && dragState.activeTabId !== this.manager.tabId) {
      this.manager.notifyDragDrop(this.instanceId, serializedData, dragState.activeTabId)
      this.destroy()
    } else {
      this.manager.notifyDragEnd(this.instanceId, serializedData)
    }

    this.isDragging = false
    this.hasLeftTab = false

    if (!this.isHidden) {
      this.onDragEnd()
    }
  }

  private getScreenPosition(): ScreenPosition {
    const rect = this.element.getBoundingClientRect()
    return {
      screenX: window.screenX + rect.left + rect.width / 2,
      screenY: window.screenY + rect.top + rect.height / 2,
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

  protected onDragStart(): void {}

  protected onDragMove(_screenPosition: ScreenPosition): void {}

  protected onDragEnd(): void {}

  protected onLeaveTab(): void {
    this.element.style.opacity = '0.3'
  }

  protected onEnterTab(): void {
    this.element.style.opacity = '1'
  }

  hide(): void {
    if (this.isHidden) {
      return
    }
    this.isHidden = true
    this.element.style.opacity = '0'
  }

  show(): void {
    if (!this.isHidden) {
      return
    }
    this.isHidden = false
    this.element.style.opacity = '1'
  }

  isElementHidden(): boolean {
    return this.isHidden
  }

  destroy(): void {
    this.drag.setDisabled()
    this.manager.unregisterInstance(this.instanceId)
    this.element.remove()
  }
}

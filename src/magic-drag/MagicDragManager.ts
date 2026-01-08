import type {
  DragOffset,
  DragState,
  MagicDragBase,
  MagicDragConstructor,
  MagicDragManagerOptions,
  MagicDragMessage,
  PreviewInfo,
  ScreenPosition,
  SerializedData,
  TabInfo
} from './types'
import { MagicDragMessageType } from './types'

const DEFAULT_CHANNEL_NAME = 'magic-drag-channel'
const DEFAULT_HEARTBEAT_INTERVAL = 5000
const DEFAULT_TAB_TIMEOUT = 15000
const DEFAULT_PREVIEW_Z_INDEX = 9999
const DEFAULT_PREVIEW_OPACITY = 0.7

function generateUUID(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class MagicDragManager {
  private static instance: MagicDragManager | null = null

  readonly tabId: string = generateUUID()
  private channel: BroadcastChannel
  private options: Required<MagicDragManagerOptions>

  private classRegistry = new Map<string, MagicDragConstructor>()
  private instances = new Map<string, MagicDragBase>()
  private knownTabs = new Map<string, TabInfo>()

  private dragState: DragState = {
    isDragging: false,
    draggingInstanceId: null,
    sourceTabId: null,
    activeTabId: null,
    serializedData: null,
    lastScreenPosition: null
  }

  private previewInfo: PreviewInfo | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private isActivated = false
  private pendingExternalDrag: MagicDragMessage | null = null

  private constructor(options: MagicDragManagerOptions = {}) {
    this.options = {
      channelName: options.channelName ?? DEFAULT_CHANNEL_NAME,
      previewContainer: options.previewContainer ?? document.body,
      heartbeatInterval:
        options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      tabTimeout: options.tabTimeout ?? DEFAULT_TAB_TIMEOUT
    }

    this.channel = new BroadcastChannel(this.options.channelName)
    this.setupChannelListener()
    this.setupTabActivationListener()
    this.startHeartbeat()
  }

  static getInstance(options?: MagicDragManagerOptions): MagicDragManager {
    if (!MagicDragManager.instance) {
      MagicDragManager.instance = new MagicDragManager(options)
    }
    return MagicDragManager.instance
  }

  static resetInstance(): void {
    if (MagicDragManager.instance) {
      MagicDragManager.instance.destroy()
      MagicDragManager.instance = null
    }
  }

  registerClass(className: string, constructor: MagicDragConstructor): void {
    this.classRegistry.set(className, constructor)
  }

  unregisterClass(className: string): void {
    this.classRegistry.delete(className)
  }

  registerInstance(instance: MagicDragBase): void {
    this.instances.set(instance.instanceId, instance)
  }

  unregisterInstance(instanceId: string): void {
    this.instances.delete(instanceId)
  }

  getInstance(instanceId: string): MagicDragBase | undefined {
    return this.instances.get(instanceId)
  }

  getDragState(): Readonly<DragState> {
    return this.dragState
  }

  isExternalDragActive(): boolean {
    return (
      this.dragState.isDragging &&
      this.dragState.sourceTabId !== null &&
      this.dragState.sourceTabId !== this.tabId
    )
  }

  broadcastMessage<T = unknown>(
    message: Omit<MagicDragMessage<T>, 'sourceTabId'>
  ): void {
    const fullMessage: MagicDragMessage<T> = {
      ...message,
      sourceTabId: this.tabId
    }
    this.channel.postMessage(fullMessage)
  }

  notifyDragStart(instanceId: string, serializedData: SerializedData): void {
    this.dragState = {
      isDragging: true,
      draggingInstanceId: instanceId,
      sourceTabId: this.tabId,
      activeTabId: null,
      serializedData,
      lastScreenPosition: null
    }

    this.broadcastMessage({
      type: MagicDragMessageType.DRAG_START,
      instanceId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })
  }

  notifyDragMove(
    instanceId: string,
    screenPosition: ScreenPosition,
    serializedData: SerializedData
  ): void {
    this.dragState.lastScreenPosition = screenPosition
    this.dragState.serializedData = serializedData

    this.broadcastMessage({
      type: MagicDragMessageType.DRAG_MOVE,
      instanceId,
      payload: {
        serializedData,
        screenPosition,
        timestamp: Date.now()
      }
    })
  }

  notifyDragEnd(instanceId: string, serializedData: SerializedData): void {
    const wasExternalDrag = this.isExternalDragActive()

    this.broadcastMessage({
      type: MagicDragMessageType.DRAG_END,
      instanceId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    if (!wasExternalDrag) {
      this.resetDragState()
    }
  }

  notifyDragDrop(
    instanceId: string,
    serializedData: SerializedData,
    targetTabId: string
  ): void {
    this.broadcastMessage({
      type: MagicDragMessageType.DRAG_DROP,
      instanceId,
      targetTabId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    this.resetDragState()
    this.removePreview()
  }

  notifyDragAbort(instanceId: string, serializedData: SerializedData): void {
    this.broadcastMessage({
      type: MagicDragMessageType.DRAG_ABORT,
      instanceId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    this.resetDragState()
    this.removePreview()
  }

  private setupChannelListener(): void {
    this.channel.onmessage = (event: MessageEvent<MagicDragMessage>) => {
      const message = event.data

      if (message.sourceTabId === this.tabId) {
        return
      }

      this.handleExternalMessage(message)
    }
  }

  private handleExternalMessage(message: MagicDragMessage): void {
    this.updateTabInfo(message.sourceTabId)

    switch (message.type) {
      case MagicDragMessageType.DRAG_START:
        this.handleExternalDragStart(message)
        break

      case MagicDragMessageType.DRAG_MOVE:
        this.handleExternalDragMove(message)
        break

      case MagicDragMessageType.DRAG_END:
        this.handleExternalDragEnd(message)
        break

      case MagicDragMessageType.DRAG_ENTER_TAB:
        this.handleExternalDragEnterTab(message)
        break

      case MagicDragMessageType.DRAG_LEAVE_TAB:
        this.handleExternalDragLeaveTab(message)
        break

      case MagicDragMessageType.DRAG_DROP:
        this.handleExternalDragDrop(message)
        break

      case MagicDragMessageType.DRAG_ABORT:
        this.handleExternalDragAbort(message)
        break

      case MagicDragMessageType.TAB_ACTIVATED:
        this.handleTabActivated(message)
        break

      case MagicDragMessageType.HEARTBEAT:
        this.handleHeartbeat(message)
        break

      case MagicDragMessageType.HEARTBEAT_ACK:
        this.handleHeartbeatAck(message)
        break
    }
  }

  private handleExternalDragStart(message: MagicDragMessage): void {
    this.dragState = {
      isDragging: true,
      draggingInstanceId: message.instanceId,
      sourceTabId: message.sourceTabId,
      activeTabId: null,
      serializedData: message.payload.serializedData ?? null,
      lastScreenPosition: message.payload.screenPosition ?? null
    }

    this.pendingExternalDrag = message
  }

  private handleExternalDragMove(message: MagicDragMessage): void {
    if (!this.dragState.isDragging) {
      this.handleExternalDragStart(message)
    }

    this.dragState.lastScreenPosition = message.payload.screenPosition ?? null
    this.dragState.serializedData = message.payload.serializedData ?? null

    const screenPosition = message.payload.screenPosition
    if (screenPosition && this.isMouseInCurrentTab(screenPosition)) {
      this.dragState.activeTabId = this.tabId

      this.broadcastMessage({
        type: MagicDragMessageType.DRAG_ENTER_TAB,
        instanceId: message.instanceId,
        targetTabId: this.tabId,
        payload: {
          serializedData: this.dragState.serializedData ?? undefined,
          timestamp: Date.now()
        }
      })

      if (!this.previewInfo && this.dragState.serializedData) {
        this.createPreview(screenPosition, this.dragState.serializedData)
      }
    }

    if (this.previewInfo && screenPosition) {
      this.updatePreviewPosition(
        screenPosition,
        this.dragState.serializedData?.dragOffset
      )
    }
  }

  private handleExternalDragEnd(message: MagicDragMessage): void {
    if (this.dragState.sourceTabId === message.sourceTabId) {
      this.resetDragState()
      this.removePreview()
    }
  }

  private handleExternalDragAbort(message: MagicDragMessage): void {
    if (this.dragState.sourceTabId === message.sourceTabId) {
      this.resetDragState()
      this.removePreview()
    }
  }

  private handleExternalDragEnterTab(message: MagicDragMessage): void {
    if (message.sourceTabId === this.dragState.sourceTabId) {
      this.dragState.activeTabId = this.tabId
      if (
        !this.previewInfo &&
        this.dragState.serializedData &&
        this.dragState.lastScreenPosition
      ) {
        this.createPreview(
          this.dragState.lastScreenPosition,
          this.dragState.serializedData
        )
      }
    }
  }

  private handleExternalDragLeaveTab(message: MagicDragMessage): void {
    const instance = this.instances.get(message.instanceId)
    if (instance && 'hide' in instance) {
      ;(instance as { hide: () => void }).hide()
    }
  }

  private isMouseInCurrentTab(screenPosition: ScreenPosition): boolean {
    const clientX = screenPosition.screenX - window.screenX
    const clientY = screenPosition.screenY - window.screenY

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    return (
      clientX >= 0 &&
      clientX <= viewportWidth &&
      clientY >= 0 &&
      clientY <= viewportHeight
    )
  }

  private handleExternalDragDrop(message: MagicDragMessage): void {
    if (message.targetTabId === this.tabId && message.payload.serializedData) {
      this.createInstanceFromSerialized(message.payload.serializedData)
    }

    this.resetDragState()
    this.removePreview()
  }

  private handleTabActivated(message: MagicDragMessage): void {
    if (
      this.dragState.isDragging &&
      this.dragState.sourceTabId === this.tabId
    ) {
      this.broadcastMessage({
        type: MagicDragMessageType.DRAG_LEAVE_TAB,
        instanceId: this.dragState.draggingInstanceId ?? '',
        targetTabId: message.sourceTabId,
        payload: {
          serializedData: this.dragState.serializedData ?? undefined,
          timestamp: Date.now()
        }
      })
    }
  }

  private handleHeartbeat(message: MagicDragMessage): void {
    this.broadcastMessage({
      type: MagicDragMessageType.HEARTBEAT_ACK,
      instanceId: '',
      targetTabId: message.sourceTabId,
      payload: {
        timestamp: Date.now()
      }
    })
  }

  private handleHeartbeatAck(message: MagicDragMessage): void {
    this.updateTabInfo(message.sourceTabId)
  }

  private setupTabActivationListener(): void {
    const activationHandler = (
      event: MouseEvent | TouchEvent | PointerEvent
    ) => {
      if (!this.isActivated) {
        this.isActivated = true
        this.onTabActivated(event)
      }
    }

    const deactivationHandler = () => {
      this.isActivated = false
    }

    document.addEventListener('mousemove', activationHandler, { passive: true })
    document.addEventListener('touchmove', activationHandler, { passive: true })
    document.addEventListener('pointermove', activationHandler, {
      passive: true
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        deactivationHandler()
      }
    })

    window.addEventListener('blur', deactivationHandler)
  }

  private onTabActivated(event: MouseEvent | TouchEvent | PointerEvent): void {
    this.broadcastMessage({
      type: MagicDragMessageType.TAB_ACTIVATED,
      instanceId: '',
      payload: {
        timestamp: Date.now()
      }
    })

    if (
      this.pendingExternalDrag &&
      this.dragState.isDragging &&
      this.dragState.sourceTabId !== this.tabId
    ) {
      this.createPreviewFromExternalDrag(event)
    }
  }

  private createPreview(
    screenPosition: ScreenPosition,
    serializedData: SerializedData
  ): void {
    const Constructor = this.classRegistry.get(serializedData.className)

    if (!Constructor) {
      console.warn(
        `[MagicDragManager] Unknown class: ${serializedData.className}`
      )
      return
    }

    const previewElement = document.createElement('div')
    previewElement.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: ${DEFAULT_PREVIEW_Z_INDEX};
      opacity: ${DEFAULT_PREVIEW_OPACITY};
      transition: transform 0.05s ease-out;
    `

    this.options.previewContainer.appendChild(previewElement)

    const previewInstance = new Constructor(previewElement)
    previewInstance.deserialize(serializedData)

    this.previewInfo = {
      element: previewElement,
      instanceId: serializedData.instanceId,
      createdAt: Date.now()
    }

    this.updatePreviewPosition(screenPosition, serializedData.dragOffset)

    this.registerInstance(previewInstance)
  }

  private createPreviewFromExternalDrag(
    event: MouseEvent | TouchEvent | PointerEvent
  ): void {
    if (!this.dragState.serializedData) {
      return
    }

    const position = this.getEventScreenPosition(event)
    this.createPreview(position, this.dragState.serializedData)
  }

  private getEventScreenPosition(
    event: MouseEvent | TouchEvent | PointerEvent
  ): ScreenPosition {
    if ('touches' in event && event.touches.length > 0) {
      const touch = event.touches[0]
      return { screenX: touch?.screenX ?? 0, screenY: touch?.screenY ?? 0 }
    }

    if ('screenX' in event) {
      return { screenX: event.screenX, screenY: event.screenY }
    }

    return { screenX: 0, screenY: 0 }
  }

  private updatePreviewPosition(
    screenPosition: ScreenPosition,
    dragOffset?: DragOffset
  ): void {
    if (!this.previewInfo) {
      return
    }

    const clientX = screenPosition.screenX - window.screenX
    const clientY = screenPosition.screenY - window.screenY

    const offsetX = dragOffset?.x ?? 0
    const offsetY = dragOffset?.y ?? 0

    const left = clientX - offsetX
    const top = clientY - offsetY

    this.previewInfo.element.style.left = `${left}px`
    this.previewInfo.element.style.top = `${top}px`
  }

  private removePreview(): void {
    if (!this.previewInfo) {
      return
    }

    const instanceId = this.previewInfo.instanceId
    this.unregisterInstance(instanceId)

    this.previewInfo.element.remove()
    this.previewInfo = null
  }

  private createInstanceFromSerialized(
    serializedData: SerializedData
  ): MagicDragBase | null {
    const Constructor = this.classRegistry.get(serializedData.className)

    if (!Constructor) {
      console.warn(
        `[MagicDragManager] Unknown class: ${serializedData.className}`
      )
      return null
    }

    if (
      this.previewInfo &&
      this.previewInfo.instanceId === serializedData.instanceId
    ) {
      const existingInstance = this.instances.get(serializedData.instanceId)
      if (existingInstance) {
        this.previewInfo.element.style.opacity = '1'
        this.previewInfo.element.style.pointerEvents = 'auto'
        this.previewInfo = null
        return existingInstance
      }
    }

    const element = document.createElement('div')
    this.options.previewContainer.appendChild(element)

    const instance = new Constructor(element)
    instance.deserialize(serializedData)
    this.registerInstance(instance)

    return instance
  }

  private resetDragState(): void {
    this.dragState = {
      isDragging: false,
      draggingInstanceId: null,
      sourceTabId: null,
      activeTabId: null,
      serializedData: null,
      lastScreenPosition: null
    }
    this.pendingExternalDrag = null
  }

  private updateTabInfo(tabId: string): void {
    this.knownTabs.set(tabId, {
      tabId,
      lastActiveTime: Date.now(),
      isOnline: true
    })
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.broadcastMessage({
        type: MagicDragMessageType.HEARTBEAT,
        instanceId: '',
        payload: {
          timestamp: Date.now()
        }
      })

      this.cleanupOfflineTabs()
    }, this.options.heartbeatInterval)
  }

  private cleanupOfflineTabs(): void {
    const now = Date.now()
    const timeout = this.options.tabTimeout

    for (const [tabId, info] of this.knownTabs) {
      if (now - info.lastActiveTime > timeout) {
        this.knownTabs.delete(tabId)
      }
    }
  }

  getOnlineTabs(): TabInfo[] {
    return Array.from(this.knownTabs.values()).filter((tab) => tab.isOnline)
  }

  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    this.removePreview()
    this.channel.close()
    this.instances.clear()
    this.classRegistry.clear()
    this.knownTabs.clear()
    this.resetDragState()
  }
}

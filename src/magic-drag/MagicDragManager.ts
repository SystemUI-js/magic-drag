import type {
  DragOffset,
  DragState,
  MagicDragBase,
  MagicDragConstructor,
  MagicDragEventListener,
  MagicDragEventListenerEntry,
  MagicDragEventListenerOptions,
  MagicDragEventListenerStore,
  MagicDragManagerOptions,
  MagicDragMessage,
  MagicDragEventMap,
  MagicDragMessagePayload,
  MagicDragOtherTabExtensionName,
  PreviewInfo,
  ScreenPosition,
  SerializedData,
  TabInfo
} from './types'
import { setMagicDragCoordinator } from './types'
import { MagicDragMessageType } from './types'

const DEFAULT_CHANNEL_NAME = 'magic-drag-channel'
const DEFAULT_HEARTBEAT_INTERVAL = 5000
const DEFAULT_TAB_TIMEOUT = 15000
const DEFAULT_PREVIEW_Z_INDEX = 9999
const DEFAULT_PREVIEW_OPACITY = 0.7
const DEFAULT_NO_LISTENER_LOG_INTERVAL = 30000

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
  private channels = new Map<string, BroadcastChannel>()
  private channelHandlers = new Map<
    string,
    (event: MessageEvent<MagicDragMessage>) => void
  >()
  private unavailableChannels = new Set<string>()
  private options: Required<MagicDragManagerOptions>

  private classRegistry = new Map<string, MagicDragConstructor>()
  private instances = new Map<string, MagicDragBase>()
  private instancesByClassName = new Map<string, Set<MagicDragBase>>()
  private classNameByChannel = new Map<string, string>()
  private knownTabs = new Map<string, TabInfo>()
  private eventListeners: MagicDragEventListenerStore = new Map()
  private channelNames = new Map<string, string>()
  private channelRefCounts = new Map<string, number>()
  private lastNoListenerLogAt = new Map<MagicDragMessageType, number>()

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

    this.setupChannelListener(this.options.channelName)
    this.setupTabActivationListener()
    this.startHeartbeat()
    setMagicDragCoordinator(this)
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
    setMagicDragCoordinator(null)
  }

  registerClass(className: string, constructor: MagicDragConstructor): void {
    if (this.classRegistry.has(className)) {
      throw new Error(
        `[MagicDragManager] Duplicate className registration: ${className}`
      )
    }

    const channelName = constructor.channelName ?? DEFAULT_CHANNEL_NAME
    if (!channelName || channelName.trim().length === 0) {
      throw new Error(
        `[MagicDragManager] Invalid channelName for ${className}: ${channelName}`
      )
    }

    const existingClass = this.classNameByChannel.get(channelName)
    if (existingClass && existingClass !== className) {
      throw new Error(
        `[MagicDragManager] channelName conflict: ${channelName} already used by ${existingClass}`
      )
    }

    this.classRegistry.set(className, constructor)
    this.channelNames.set(className, channelName)
    this.classNameByChannel.set(channelName, className)

    const nextCount = (this.channelRefCounts.get(channelName) ?? 0) + 1
    this.channelRefCounts.set(channelName, nextCount)
    this.setupChannelListener(channelName)
  }

  unregisterClass(className: string): void {
    const channelName = this.channelNames.get(className)

    this.classRegistry.delete(className)
    this.channelNames.delete(className)

    if (channelName) {
      this.classNameByChannel.delete(channelName)
    }

    if (!channelName) {
      return
    }

    const nextCount = (this.channelRefCounts.get(channelName) ?? 0) - 1
    if (nextCount > 0) {
      this.channelRefCounts.set(channelName, nextCount)
      return
    }

    this.channelRefCounts.delete(channelName)
    if (channelName !== this.options.channelName) {
      this.teardownChannelListener(channelName)
    }
  }

  addEventListener<EventType extends MagicDragMessageType>(
    type: EventType,
    listener: MagicDragEventListener<MagicDragEventMap[EventType]>,
    options: MagicDragEventListenerOptions = {}
  ): void {
    const entry: MagicDragEventListenerEntry<MagicDragMessageType> = {
      type,
      listener: listener as MagicDragEventListener<MagicDragMessage>,
      originalListener: listener as MagicDragEventListener<
        MagicDragEventMap[EventType]
      >,
      channelName: options.channelName
    }

    const existing = this.eventListeners.get(type)
    if (!existing) {
      this.eventListeners.set(type, new Set([entry]))
      return
    }

    existing.add(entry)
  }

  removeEventListener<EventType extends MagicDragMessageType>(
    type: EventType,
    listener: MagicDragEventListener<MagicDragEventMap[EventType]>
  ): void {
    const existing = this.eventListeners.get(type)
    if (!existing) {
      return
    }

    for (const entry of existing) {
      if (entry.originalListener === listener) {
        existing.delete(entry)
      }
    }

    if (existing.size === 0) {
      this.eventListeners.delete(type)
    }
  }

  registerInstance(instance: MagicDragBase): void {
    this.instances.set(instance.instanceId, instance)
    const className = instance.getClassName()
    const collection = this.instancesByClassName.get(className) ?? new Set()
    collection.add(instance)
    this.instancesByClassName.set(className, collection)
  }

  unregisterInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      return
    }

    const className = instance.getClassName()
    const collection = this.instancesByClassName.get(className)
    if (collection) {
      collection.delete(instance)
      if (collection.size === 0) {
        this.instancesByClassName.delete(className)
      }
    }

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
    const channelName = this.getMessageChannelName(fullMessage)

    try {
      this.setupChannelListener(channelName)
      this.getChannel(channelName).postMessage(fullMessage)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error(
        `[MagicDragManager] Failed to broadcast ${fullMessage.type} on ${channelName}: ${reason}`
      )
    }
  }

  notifyDragStart(instanceId: string, serializedData: SerializedData): void {
    this.dragState = {
      isDragging: true,
      draggingInstanceId: instanceId,
      sourceTabId: this.tabId,
      activeTabId: this.tabId,
      serializedData,
      lastScreenPosition: null
    }

    const message: MagicDragMessage = {
      type: MagicDragMessageType.DRAG_START,
      instanceId,
      sourceTabId: this.tabId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    }
    this.dispatchEvent(message)
    this.broadcastMessage(message)
  }

  notifyDragMove(
    instanceId: string,
    screenPosition: ScreenPosition,
    serializedData: SerializedData
  ): void {
    this.dragState.lastScreenPosition = screenPosition
    this.dragState.serializedData = serializedData

    const message: MagicDragMessage = {
      type: MagicDragMessageType.DRAG_MOVE,
      instanceId,
      sourceTabId: this.tabId,
      payload: {
        serializedData,
        screenPosition,
        timestamp: Date.now()
      }
    }
    this.dispatchEvent(message)
    this.broadcastMessage(message)
  }

  notifyDragEnd(instanceId: string, serializedData: SerializedData): void {
    const wasExternalDrag = this.isExternalDragActive()

    const message: MagicDragMessage = {
      type: MagicDragMessageType.DRAG_END,
      instanceId,
      sourceTabId: this.tabId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    }
    this.dispatchEvent(message)
    this.broadcastMessage(message)

    if (!wasExternalDrag) {
      this.resetDragState()
    }
  }

  notifyDragDrop(
    instanceId: string,
    serializedData: SerializedData,
    targetTabId: string
  ): void {
    const message: MagicDragMessage = {
      type: MagicDragMessageType.DRAG_DROP,
      instanceId,
      sourceTabId: this.tabId,
      targetTabId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    }
    this.dispatchEvent(message)
    this.broadcastMessage(message)

    this.resetDragState()
    this.removePreview()
  }

  notifyDragAbort(instanceId: string, serializedData: SerializedData): void {
    const message: MagicDragMessage = {
      type: MagicDragMessageType.DRAG_ABORT,
      instanceId,
      sourceTabId: this.tabId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    }
    this.dispatchEvent(message)
    this.broadcastMessage(message)

    this.resetDragState()
    this.removePreview()
  }

  private getChannel(channelName: string): BroadcastChannel {
    let channel = this.channels.get(channelName)
    if (!channel) {
      if (this.unavailableChannels.has(channelName)) {
        throw new Error(
          `[MagicDragManager] BroadcastChannel unavailable for ${channelName}`
        )
      }

      try {
        channel = new BroadcastChannel(channelName)
        this.channels.set(channelName, channel)
      } catch (error) {
        this.unavailableChannels.add(channelName)
        const reason = error instanceof Error ? error.message : String(error)
        console.error(
          `[MagicDragManager] Failed to create BroadcastChannel for ${channelName}: ${reason}`
        )
        throw error
      }
    }
    return channel
  }

  private setupChannelListener(channelName: string): void {
    if (this.channelHandlers.has(channelName)) {
      return
    }

    let channel: BroadcastChannel
    try {
      channel = this.getChannel(channelName)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error(
        `[MagicDragManager] BroadcastChannel disabled; fallback to single-tab. channelName=${channelName} reason=${reason}`
      )
      return
    }

    const handler = (event: MessageEvent<MagicDragMessage>) => {
      const message = event.data

      if (message.sourceTabId === this.tabId) {
        return
      }

      this.handleExternalMessage(message)
    }

    channel.addEventListener('message', handler)
    this.channelHandlers.set(channelName, handler)
  }

  private teardownChannelListener(channelName: string): void {
    const channel = this.channels.get(channelName)
    const handler = this.channelHandlers.get(channelName)

    if (channel && handler) {
      channel.removeEventListener('message', handler)
    }

    if (channel) {
      channel.close()
      this.channels.delete(channelName)
    }

    if (handler) {
      this.channelHandlers.delete(channelName)
    }
  }

  private handleExternalMessage(message: MagicDragMessage): void {
    const className = message.payload.serializedData?.className
    if (className && !this.classRegistry.has(className)) {
      const channelName = this.channelNames.get(className)
      this.warnUnregisteredClassName(
        className,
        'Unregistered class message ignored',
        message.type,
        channelName
      )
      return
    }

    this.updateTabInfo(message.sourceTabId)
    this.dispatchEvent(message)

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

  private dispatchEvent(message: MagicDragMessage<unknown>): void {
    const listeners = this.eventListeners.get(message.type)
    if (!listeners || listeners.size === 0) {
      this.maybeLogNoListener(message)
      return
    }

    const messageChannelName = this.resolveMessageChannelName(message)

    for (const entry of listeners) {
      if (entry.channelName && messageChannelName !== entry.channelName) {
        continue
      }

      entry.listener(message as MagicDragMessage<unknown>)
    }
  }

  private resolveMessageChannelName(message: MagicDragMessage): string | null {
    const serializedData = message.payload.serializedData
    if (serializedData?.className) {
      return this.channelNames.get(serializedData.className) ?? null
    }

    if (!message.instanceId) {
      return null
    }

    const instance = this.instances.get(message.instanceId)
    if (!instance) {
      return null
    }

    return this.channelNames.get(instance.serialize().className) ?? null
  }

  private getMessageChannelName(message: MagicDragMessage): string {
    return this.resolveMessageChannelName(message) ?? this.options.channelName
  }

  private maybeLogNoListener(message: MagicDragMessage<unknown>): void {
    const now = Date.now()
    const lastLogAt = this.lastNoListenerLogAt.get(message.type) ?? 0
    if (now - lastLogAt < DEFAULT_NO_LISTENER_LOG_INTERVAL) {
      return
    }

    this.lastNoListenerLogAt.set(message.type, now)

    const className = message.payload.serializedData?.className
    const channelName = className ? this.channelNames.get(className) : undefined
    console.warn(
      `[MagicDragManager] No listeners registered for ${message.type} class=${className ?? 'unknown'} channel=${channelName ?? 'unknown'}`
    )
  }

  private handleExternalDragStart(message: MagicDragMessage): void {
    this.dragState = {
      isDragging: true,
      draggingInstanceId: message.instanceId,
      sourceTabId: message.sourceTabId,
      activeTabId: message.sourceTabId,
      serializedData: message.payload.serializedData ?? null,
      lastScreenPosition: message.payload.screenPosition ?? null
    }

    this.pendingExternalDrag = message
    this.invokeOtherTabCallbacks(
      message.payload.serializedData?.className ?? null,
      'onOtherTabDragStart',
      message.payload
    )
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

      const enterMessage: MagicDragMessage = {
        type: MagicDragMessageType.DRAG_ENTER_TAB,
        instanceId: message.instanceId,
        sourceTabId: this.tabId,
        targetTabId: this.tabId,
        payload: {
          serializedData: this.dragState.serializedData ?? undefined,
          timestamp: Date.now()
        }
      }
      this.dispatchEvent(enterMessage)
      this.broadcastMessage(enterMessage)

      if (!this.previewInfo && this.dragState.serializedData) {
        this.createPreview(screenPosition, this.dragState.serializedData)
      }
    } else if (screenPosition && this.dragState.activeTabId === this.tabId) {
      this.dragState.activeTabId = null
    }

    if (this.previewInfo && screenPosition) {
      this.updatePreviewPosition(
        screenPosition,
        this.dragState.serializedData?.dragOffset
      )
    }

    this.invokeOtherTabCallbacks(
      message.payload.serializedData?.className ?? null,
      'onOtherTabDragMove',
      message.payload
    )
  }

  private handleExternalDragEnd(message: MagicDragMessage): void {
    if (this.dragState.sourceTabId === message.sourceTabId) {
      this.invokeOtherTabCallbacks(
        message.payload.serializedData?.className ?? null,
        'onOtherTabDragEnd',
        message.payload
      )
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
      const serializedData = message.payload.serializedData
      const className = serializedData?.className ?? null
      const Constructor = className ? this.classRegistry.get(className) : null
      if (!Constructor && className) {
        console.warn(`[MagicDragManager] Unknown class: ${className}`)
      }

      if (Constructor?.onEnterTab && serializedData) {
        Constructor.onEnterTab(message.payload)
      }

      this.dragState.activeTabId = message.targetTabId ?? this.tabId
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

  private handleExternalDragLeaveTab(_message: MagicDragMessage): void {}

  private warnUnregisteredClassName(
    className: string,
    context: string,
    messageType?: MagicDragMessageType,
    channelName?: string
  ): void {
    const typeLabel = messageType ? ` type=${messageType}` : ''
    const channelLabel = channelName ? ` channel=${channelName}` : ''
    console.warn(
      `[MagicDragManager] ${context}: ${className}${typeLabel}${channelLabel}`
    )
  }

  private invokeOtherTabCallbacks(
    className: string | null,
    method: MagicDragOtherTabExtensionName,
    payload: MagicDragMessagePayload
  ): void {
    if (!className) {
      return
    }

    const instances = this.instancesByClassName.get(className)
    if (!instances || instances.size === 0) {
      const channelName = this.channelNames.get(className)
      this.warnUnregisteredClassName(
        className,
        'Unknown class',
        undefined,
        channelName
      )
      return
    }

    for (const instance of instances) {
      const callback = instance[method]
      if (typeof callback === 'function') {
        callback.call(instance, payload)
      }
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
      const leaveMessage: MagicDragMessage = {
        type: MagicDragMessageType.DRAG_LEAVE_TAB,
        instanceId: this.dragState.draggingInstanceId ?? '',
        sourceTabId: this.tabId,
        targetTabId: message.sourceTabId,
        payload: {
          serializedData: this.dragState.serializedData ?? undefined,
          timestamp: Date.now()
        }
      }
      this.dispatchEvent(leaveMessage)
      this.broadcastMessage(leaveMessage)
    }
  }

  private handleHeartbeat(message: MagicDragMessage): void {
    const ackMessage: MagicDragMessage = {
      type: MagicDragMessageType.HEARTBEAT_ACK,
      instanceId: '',
      sourceTabId: this.tabId,
      targetTabId: message.sourceTabId,
      payload: {
        timestamp: Date.now()
      }
    }
    this.broadcastMessage(ackMessage)
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
    const message: MagicDragMessage = {
      type: MagicDragMessageType.TAB_ACTIVATED,
      instanceId: '',
      sourceTabId: this.tabId,
      payload: {
        timestamp: Date.now()
      }
    }
    this.dispatchEvent(message)
    this.broadcastMessage(message)

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
      const heartbeatMessage: MagicDragMessage = {
        type: MagicDragMessageType.HEARTBEAT,
        instanceId: '',
        sourceTabId: this.tabId,
        payload: {
          timestamp: Date.now()
        }
      }
      this.dispatchEvent(heartbeatMessage)
      this.broadcastMessage(heartbeatMessage)

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

    for (const [channelName] of this.channels) {
      this.teardownChannelListener(channelName)
    }

    this.instances.clear()
    this.classRegistry.clear()
    this.channelNames.clear()
    this.channelRefCounts.clear()
    this.knownTabs.clear()
    this.eventListeners.clear()
    this.resetDragState()
  }
}

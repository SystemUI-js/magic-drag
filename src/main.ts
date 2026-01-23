import {
  MagicDrag,
  MagicDragManager,
  MagicDragMessageType,
  type MagicDragMessage,
  type MagicDragMessagePayload,
  type ScreenPosition,
  type SerializedData
} from './magic-drag'

interface CardData {
  title: string
  content: string
  color: string
}

type CardStatus = 'idle' | 'dragging' | 'preview' | 'dropped' | 'destroyed'

interface CardRuntime {
  externalId: string
  localId: string
  instance: DemoCard
  element: HTMLElement
  originTabId: string
  currentTabId: string
  status: CardStatus
  lastUpdatedAt: number
  lastSerialized?: SerializedData<CardData>
}

interface EventLogEntry {
  id: string
  tabId: string
  instanceId: string
  method: string
  timestamp: number
  summary: string
}

type DragOffsetValue = { x: number; y: number }

interface DemoDestroyMessage {
  type: 'demo_destroy'
  instanceId: string
  sourceTabId: string
  targetTabId: string
  timestamp: number
}

const DEMO_CHANNEL_NAME = 'magic-drag-demo'
const MAX_LOG_ENTRIES = 200

const createId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const formatTime = (timestamp: number): string => {
  const time = new Date(timestamp)
  return time.toLocaleTimeString('en-US', { hour12: false })
}

const summarizeSerializedData = (data?: SerializedData<unknown>): string => {
  if (!data) {
    return 'no payload'
  }

  const customData = data.customData as Record<string, unknown> | undefined
  const title = customData?.title
  const color = customData?.color
  return `title=${title ?? 'n/a'} color=${color ?? 'n/a'} id=${data.instanceId}`
}

const manager = MagicDragManager.getInstance()
const runtimeCards = new Map<string, CardRuntime>()
const eventLogs: EventLogEntry[] = []

let cardContainer: HTMLDivElement | null = null
let logList: HTMLUListElement | null = null
let logStats: HTMLSpanElement | null = null

const updateLogStats = (): void => {
  if (!logStats) {
    return
  }

  logStats.textContent = `${eventLogs.length} events`
}

const renderLogs = (): void => {
  if (!logList) {
    return
  }

  logList.innerHTML = ''

  eventLogs.forEach((entry) => {
    const item = document.createElement('li')
    item.className = 'log-item'

    const meta = document.createElement('div')
    meta.className = 'log-meta'
    meta.textContent = `${formatTime(entry.timestamp)} · ${entry.method}`

    const detail = document.createElement('div')
    detail.className = 'log-detail'
    detail.textContent = `${entry.summary} · tab=${entry.tabId.slice(0, 6)} · instance=${entry.instanceId.slice(0, 6)}`

    item.appendChild(meta)
    item.appendChild(detail)
    logList?.appendChild(item)
  })

  updateLogStats()
}

const pushLog = (
  entry: Omit<EventLogEntry, 'id' | 'timestamp' | 'tabId'> & {
    tabId?: string
  }
): void => {
  eventLogs.unshift({
    id: createId(),
    tabId: entry.tabId ?? manager.tabId,
    instanceId: entry.instanceId,
    method: entry.method,
    timestamp: Date.now(),
    summary: entry.summary
  })

  if (eventLogs.length > MAX_LOG_ENTRIES) {
    eventLogs.length = MAX_LOG_ENTRIES
  }

  renderLogs()
}

const setCardVisualState = (element: HTMLElement, status: CardStatus): void => {
  element.classList.remove(
    'demo-card--idle',
    'demo-card--dragging',
    'demo-card--preview',
    'demo-card--dropped',
    'demo-card--destroyed'
  )
  element.classList.add(`demo-card--${status}`)
}

const updateCardPosition = (
  element: HTMLElement,
  screenPosition?: ScreenPosition,
  dragOffset?: DragOffsetValue
): void => {
  if (!cardContainer) {
    return
  }

  if (!screenPosition) {
    return
  }

  const rect = cardContainer.getBoundingClientRect()
  const clientX = screenPosition.screenX - window.screenX
  const clientY = screenPosition.screenY - window.screenY
  const offsetX = dragOffset?.x ?? 0
  const offsetY = dragOffset?.y ?? 0
  const left = clientX - rect.left - offsetX
  const top = clientY - rect.top - offsetY

  element.style.left = `${Math.max(0, left)}px`
  element.style.top = `${Math.max(0, top)}px`
}

const getLastScreenPosition = (): ScreenPosition | undefined =>
  manager.getDragState().lastScreenPosition ?? undefined

const applyPosePosition = (
  element: HTMLElement,
  data?: SerializedData<CardData>
): void => {
  const pose = data?.pose
  if (!pose || !('position' in pose)) {
    return
  }

  const position = (pose as { position: { x: number; y: number } }).position
  if (!position) {
    return
  }

  element.style.left = `${position.x}px`
  element.style.top = `${position.y}px`
}

const registerRuntimeCard = (
  runtime: CardRuntime,
  status: CardStatus
): void => {
  runtime.status = status
  runtime.lastUpdatedAt = Date.now()
  runtimeCards.set(runtime.externalId, runtime)
  setCardVisualState(runtime.element, status)
}

const removeRuntimeCard = (externalId: string): void => {
  const runtime = runtimeCards.get(externalId)
  if (!runtime) {
    return
  }

  runtime.status = 'destroyed'
  setCardVisualState(runtime.element, 'destroyed')
  runtime.instance.destroy()
  runtimeCards.delete(externalId)
}

class DemoCard extends MagicDrag<CardData> {
  private title: string
  private content: string
  private color: string
  private initialLeft: string = ''
  private initialTop: string = ''
  private initialDisplay: string = ''
  private externalInstanceId: string | null = null
  private lastMoveLogAt = 0

  constructor(
    element: HTMLElement,
    title: string,
    content: string,
    color: string
  ) {
    super(element)
    this.title = title
    this.content = content
    this.color = color
    this.render()
    this.applyStyles()
  }

  public getClassName(): string {
    return 'DemoCard'
  }

  public setExternalInstanceId(id: string): void {
    this.externalInstanceId = id
  }

  public getExternalInstanceId(): string {
    return this.externalInstanceId ?? this.instanceId
  }

  serialize(): SerializedData<CardData> {
    return this.createSerializedData({
      title: this.title,
      content: this.content,
      color: this.color
    })
  }

  deserialize(data: SerializedData<CardData>): void {
    this.title = data.customData.title
    this.content = data.customData.content
    this.color = data.customData.color
    this.render()
    this.applyStyles()
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'deserialize',
      summary: summarizeSerializedData(data)
    })
  }

  private render(): void {
    this.element.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">${this.title}</h3>
      <p style="margin: 0; font-size: 14px; opacity: 0.8;">${this.content}</p>
    `
  }

  private applyStyles(): void {
    this.element.classList.add('demo-card')
    Object.assign(this.element.style, {
      position: 'absolute',
      width: '200px',
      padding: '16px',
      borderRadius: '12px',
      background: this.color,
      color: '#fff',
      cursor: 'grab',
      userSelect: 'none',
      boxShadow: '0 12px 25px rgba(0,0,0,0.25)',
      transition: 'box-shadow 0.2s, transform 0.2s'
    })
  }

  protected onDragMove(
    _screenPosition: ScreenPosition,
    isLeaveTab: boolean
  ): void {
    const now = Date.now()
    if (now - this.lastMoveLogAt < 200) {
      return
    }

    this.lastMoveLogAt = now
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'onDragMove',
      summary: `leaveTab=${isLeaveTab}`
    })
  }
  protected onDragEnd(
    _screenPosition: ScreenPosition,
    isLeaveTab: boolean
  ): void {
    this.updateRuntimeStatus(isLeaveTab ? 'preview' : 'dropped')
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'onDragEnd',
      summary: `leaveTab=${isLeaveTab}`
    })
  }

  public onDragInInternal(): void {
    this.applyStyles()
  }

  protected onDragStart(_screenPosition: ScreenPosition): void {
    this.initialLeft = this.element.style.left
    this.initialTop = this.element.style.top
    this.initialDisplay = this.element.style.display
    this.updateRuntimeStatus('dragging')
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'onDragStart',
      summary: summarizeSerializedData(this.serialize())
    })
  }

  protected onLeaveTab(_screenPosition: ScreenPosition): void {
    this.updateRuntimeStatus('preview')
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'onLeaveTab',
      summary: 'left source tab'
    })
  }

  protected onEnterTab(_screenPosition: ScreenPosition): void {
    this.updateRuntimeStatus('dragging')
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'onEnterTab',
      summary: 'returned to source tab'
    })
  }

  // 让元素回到拖拽开始时
  protected goBackToDragStart() {
    this.element.style.left = this.initialLeft
    this.element.style.top = this.initialTop
  }

  // 销毁元素
  protected destroyElement() {
    this.element.remove()
  }

  // 隐藏元素
  protected hideElement() {
    this.element.style.display = 'none'
  }

  // 显示元素
  protected showElement() {
    this.element.style.display = this.initialDisplay || ''
  }

  protected onAbort(_screenPosition: ScreenPosition): void {
    this.goBackToDragStart()
    this.updateRuntimeStatus('idle')
    pushLog({
      instanceId: this.getExternalInstanceId(),
      method: 'onAbort',
      summary: 'drag aborted'
    })
  }

  private updateRuntimeStatus(status: CardStatus): void {
    const runtime = runtimeCards.get(this.getExternalInstanceId())
    if (!runtime) {
      return
    }

    runtime.status = status
    runtime.lastUpdatedAt = Date.now()
    setCardVisualState(this.element, status)
  }
}
manager.registerClass('DemoCard', DemoCard)

const demoChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(DEMO_CHANNEL_NAME)
    : null

const isDemoDestroyMessage = (value: unknown): value is DemoDestroyMessage => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const message = value as Record<string, unknown>
  return (
    message.type === 'demo_destroy' &&
    typeof message.instanceId === 'string' &&
    typeof message.sourceTabId === 'string' &&
    typeof message.targetTabId === 'string'
  )
}

const sendDestroySignal = (instanceId: string, targetTabId: string): void => {
  if (!demoChannel) {
    return
  }

  const message: DemoDestroyMessage = {
    type: 'demo_destroy',
    instanceId,
    sourceTabId: manager.tabId,
    targetTabId,
    timestamp: Date.now()
  }
  demoChannel.postMessage(message)
}

demoChannel?.addEventListener('message', (event) => {
  if (!isDemoDestroyMessage(event.data)) {
    return
  }

  if (event.data.targetTabId !== manager.tabId) {
    return
  }

  pushLog({
    instanceId: event.data.instanceId,
    method: 'demoDestroy',
    summary: `source=${event.data.sourceTabId.slice(0, 6)}`
  })

  removeRuntimeCard(event.data.instanceId)
})

const getSerializedCard = (
  payload: MagicDragMessagePayload
): SerializedData<CardData> | null => {
  const serialized = payload.serializedData
  if (!serialized) {
    return null
  }

  const customData = serialized.customData as
    | Record<string, unknown>
    | undefined
  if (!customData) {
    return null
  }

  if (
    typeof customData.title !== 'string' ||
    typeof customData.content !== 'string' ||
    typeof customData.color !== 'string'
  ) {
    return null
  }

  return serialized as SerializedData<CardData>
}

const ensureExternalCard = (
  serialized: SerializedData<CardData>,
  sourceTabId: string
): CardRuntime | null => {
  if (!cardContainer) {
    return null
  }

  const existing = runtimeCards.get(serialized.instanceId)
  if (existing) {
    existing.lastSerialized = serialized
    existing.lastUpdatedAt = Date.now()
    return existing
  }

  const element = document.createElement('div')
  cardContainer.appendChild(element)

  const instance = new DemoCard(
    element,
    serialized.customData.title,
    serialized.customData.content,
    serialized.customData.color
  )
  instance.setExternalInstanceId(serialized.instanceId)
  instance.deserialize(serialized)

  const runtime: CardRuntime = {
    externalId: serialized.instanceId,
    localId: instance.instanceId,
    instance,
    element,
    originTabId: sourceTabId,
    currentTabId: manager.tabId,
    status: 'preview',
    lastUpdatedAt: Date.now(),
    lastSerialized: serialized
  }

  registerRuntimeCard(runtime, 'preview')
  applyPosePosition(element, serialized)
  return runtime
}

const logMessage = (message: MagicDragMessage): void => {
  const summaryParts = []
  if (message.payload.screenPosition) {
    summaryParts.push(
      `screen=${message.payload.screenPosition.screenX},${message.payload.screenPosition.screenY}`
    )
  }
  if (message.payload.serializedData) {
    summaryParts.push(summarizeSerializedData(message.payload.serializedData))
  }

  pushLog({
    instanceId: message.instanceId,
    method: `event:${message.type.replace('magic_drag_', '')}`,
    summary: summaryParts.join(' | ') || 'no payload',
    tabId: message.sourceTabId
  })
}

const handleDragStart = (
  serialized: SerializedData<CardData>,
  sourceTabId: string
): void => {
  if (sourceTabId === manager.tabId) {
    return
  }

  const runtime = ensureExternalCard(serialized, sourceTabId)
  if (!runtime) {
    return
  }
  runtime.currentTabId = manager.tabId
  registerRuntimeCard(runtime, 'preview')
}

const handleDragMove = (
  serialized: SerializedData<CardData>,
  sourceTabId: string,
  screenPosition: ScreenPosition | undefined
): void => {
  if (sourceTabId === manager.tabId) {
    return
  }

  const runtime = ensureExternalCard(serialized, sourceTabId)
  if (!runtime) {
    return
  }
  registerRuntimeCard(runtime, 'preview')
  updateCardPosition(runtime.element, screenPosition, serialized.dragOffset)
}

const handleDragEnterTab = (
  serialized: SerializedData<CardData>,
  sourceTabId: string
): void => {
  if (sourceTabId === manager.tabId) {
    return
  }

  const runtime = ensureExternalCard(serialized, sourceTabId)
  if (!runtime) {
    return
  }
  registerRuntimeCard(runtime, 'preview')
  updateCardPosition(
    runtime.element,
    getLastScreenPosition(),
    serialized.dragOffset
  )
}

const handleDragLeaveTab = (
  serialized: SerializedData<CardData>,
  sourceTabId: string
): void => {
  if (sourceTabId === manager.tabId) {
    return
  }

  const runtime = ensureExternalCard(serialized, sourceTabId)
  if (!runtime) {
    return
  }
  registerRuntimeCard(runtime, 'dragging')
  updateCardPosition(
    runtime.element,
    getLastScreenPosition(),
    serialized.dragOffset
  )
}

const handleDragDrop = (
  serialized: SerializedData<CardData>,
  sourceTabId: string,
  targetTabId: string | undefined,
  screenPosition: ScreenPosition | undefined
): void => {
  if (!targetTabId || targetTabId !== manager.tabId) {
    return
  }

  const runtime = ensureExternalCard(serialized, sourceTabId)
  if (!runtime) {
    return
  }
  registerRuntimeCard(runtime, 'dropped')
  updateCardPosition(
    runtime.element,
    screenPosition ?? getLastScreenPosition(),
    serialized.dragOffset
  )
  sendDestroySignal(serialized.instanceId, sourceTabId)
}

const handleDragEndOrAbort = (serialized: SerializedData<CardData>): void => {
  const runtime = runtimeCards.get(serialized.instanceId)
  if (!runtime) {
    return
  }

  if (runtime.status === 'preview' || runtime.status === 'dragging') {
    removeRuntimeCard(serialized.instanceId)
  }
}

const handleExternalMessage = (message: MagicDragMessage): void => {
  logMessage(message)

  const serialized = getSerializedCard(message.payload)
  if (!serialized) {
    return
  }

  switch (message.type) {
    case MagicDragMessageType.DRAG_START: {
      handleDragStart(serialized, message.sourceTabId)
      break
    }
    case MagicDragMessageType.DRAG_MOVE: {
      handleDragMove(
        serialized,
        message.sourceTabId,
        message.payload.screenPosition
      )
      break
    }
    case MagicDragMessageType.DRAG_ENTER_TAB: {
      handleDragEnterTab(serialized, message.sourceTabId)
      break
    }
    case MagicDragMessageType.DRAG_LEAVE_TAB: {
      handleDragLeaveTab(serialized, message.sourceTabId)
      break
    }
    case MagicDragMessageType.DRAG_DROP: {
      handleDragDrop(
        serialized,
        message.sourceTabId,
        message.targetTabId,
        message.payload.screenPosition
      )
      break
    }
    case MagicDragMessageType.DRAG_END:
    case MagicDragMessageType.DRAG_ABORT: {
      handleDragEndOrAbort(serialized)
      break
    }
  }
}

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <style>
      :root {
        color-scheme: light;
      }
      body {
        font-family: 'Space Grotesk', 'Sora', 'Noto Sans', sans-serif;
        margin: 0;
        padding: 2rem;
        min-height: 100vh;
        color: #1c1c1c;
        background: radial-gradient(circle at top, #f7f3eb, #eef4f6 40%, #e8e8ef 100%);
      }
      * {
        box-sizing: border-box;
      }
      .page {
        display: grid;
        gap: 1.5rem;
      }
      .hero {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 20px 40px rgba(20, 30, 50, 0.08);
      }
      .hero h1 {
        margin: 0 0 0.35rem 0;
        font-size: 1.8rem;
      }
      .hero p {
        margin: 0;
        color: #4b5563;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        background: #f2f4f8;
        font-size: 0.85rem;
        color: #374151;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
        gap: 1.5rem;
      }
      .workspace {
        padding: 1.5rem;
        border-radius: 18px;
        background: #ffffff;
        box-shadow: 0 20px 40px rgba(20, 30, 50, 0.08);
        position: relative;
        overflow: hidden;
      }
      .workspace-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .workspace-title {
        font-size: 1.1rem;
        font-weight: 600;
      }
      #card-container {
        position: relative;
        height: 520px;
        border-radius: 14px;
        background: linear-gradient(135deg, #f7f7fb 0%, #eef1f6 100%);
        border: 1px dashed #d4d9e1;
        overflow: hidden;
      }
      .log-panel {
        padding: 1.5rem;
        border-radius: 18px;
        background: #0f172a;
        color: #e2e8f0;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
        display: flex;
        flex-direction: column;
        min-height: 520px;
      }
      .log-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .log-header h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .log-stats {
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .log-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        overflow: auto;
      }
      .log-item {
        padding: 0.75rem;
        border-radius: 12px;
        background: rgba(148, 163, 184, 0.1);
      }
      .log-meta {
        font-size: 0.8rem;
        color: #93c5fd;
        margin-bottom: 0.35rem;
      }
      .log-detail {
        font-size: 0.85rem;
        color: #e2e8f0;
      }
      .demo-card {
        backdrop-filter: blur(6px);
      }
      .demo-card--preview {
        opacity: 0.7;
        transform: scale(0.98);
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
      }
      .demo-card--dragging {
        box-shadow: 0 18px 30px rgba(15, 23, 42, 0.25);
        transform: scale(1.02);
      }
      .demo-card--destroyed {
        opacity: 0.3;
      }
      @media (max-width: 980px) {
        body {
          padding: 1.25rem;
        }
        .layout {
          grid-template-columns: 1fr;
        }
        .log-panel {
          min-height: 360px;
        }
      }
    </style>
    <div class="page">
      <div class="hero">
        <div>
          <h1>Magic Drag Demo</h1>
          <p>Drag cards between tabs. Start in one tab and finish in another to watch the event flow.</p>
        </div>
        <div class="badge">Tab ID: ${manager.tabId.slice(0, 8)}...</div>
      </div>
      <div class="layout">
        <section class="workspace">
          <div class="workspace-header">
            <div class="workspace-title">Card Stage</div>
            <div class="badge">Cross-tab ready</div>
          </div>
          <div id="card-container"></div>
        </section>
        <aside class="log-panel">
          <div class="log-header">
            <h2>Event Log</h2>
            <span class="log-stats" id="log-stats">0 events</span>
          </div>
          <ul class="log-list" id="event-log"></ul>
        </aside>
      </div>
    </div>
  `

  cardContainer = document.querySelector<HTMLDivElement>('#card-container')
  logList = document.querySelector<HTMLUListElement>('#event-log')
  logStats = document.querySelector<HTMLSpanElement>('#log-stats')

  // Demo entry: render initial cards and register runtime state.
  if (cardContainer) {
    const cards = [
      {
        title: 'Arrival Card',
        content: 'Drag me into another tab',
        color: '#f97316',
        x: 40,
        y: 70
      },
      {
        title: 'Signal Card',
        content: 'Watch the event log light up',
        color: '#0ea5e9',
        x: 280,
        y: 120
      },
      {
        title: 'Preview Card',
        content: 'Preview state follows your cursor',
        color: '#22c55e',
        x: 520,
        y: 80
      }
    ]

    cards.forEach(({ title, content, color, x, y }) => {
      const element = document.createElement('div')
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      cardContainer?.appendChild(element)

      const instance = new DemoCard(element, title, content, color)
      const runtime: CardRuntime = {
        externalId: instance.instanceId,
        localId: instance.instanceId,
        instance,
        element,
        originTabId: manager.tabId,
        currentTabId: manager.tabId,
        status: 'idle',
        lastUpdatedAt: Date.now(),
        lastSerialized: instance.serialize()
      }

      registerRuntimeCard(runtime, 'idle')
    })
  }

  updateLogStats()
}

manager.addEventListener(MagicDragMessageType.DRAG_START, handleExternalMessage)
manager.addEventListener(MagicDragMessageType.DRAG_MOVE, handleExternalMessage)
manager.addEventListener(
  MagicDragMessageType.DRAG_ENTER_TAB,
  handleExternalMessage
)
manager.addEventListener(
  MagicDragMessageType.DRAG_LEAVE_TAB,
  handleExternalMessage
)
manager.addEventListener(MagicDragMessageType.DRAG_END, handleExternalMessage)
manager.addEventListener(MagicDragMessageType.DRAG_DROP, handleExternalMessage)
manager.addEventListener(MagicDragMessageType.DRAG_ABORT, handleExternalMessage)

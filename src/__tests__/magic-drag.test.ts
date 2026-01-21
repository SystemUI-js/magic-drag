/**
 * @jest-environment jsdom
 */

import {
  MagicDrag,
  MagicDragManager,
  type ScreenPosition,
  type SerializedData
} from '../magic-drag'

class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null
  private messageListeners: Set<(event: MessageEvent) => void> = new Set()
  private static channels = new Map<string, Set<MockBroadcastChannel>>()

  constructor(name: string) {
    this.name = name
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, new Set())
    }
    MockBroadcastChannel.channels.get(name)?.add(this)
  }

  postMessage(data: unknown): void {
    const channels = MockBroadcastChannel.channels.get(this.name)
    if (channels) {
      for (const channel of channels) {
        if (channel !== this) {
          const event = new MessageEvent('message', { data })
          // 触发 onmessage 属性
          if (channel.onmessage) {
            channel.onmessage(event)
          }
          // 触发通过 addEventListener 注册的监听器
          for (const listener of channel.messageListeners) {
            listener(event)
          }
        }
      }
    }
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    if (type === 'message') {
      this.messageListeners.add(listener)
    }
  }

  removeEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    if (type === 'message') {
      this.messageListeners.delete(listener)
    }
  }

  close(): void {
    MockBroadcastChannel.channels.get(this.name)?.delete(this)
  }

  static reset(): void {
    this.channels.clear()
  }
}

global.BroadcastChannel =
  MockBroadcastChannel as unknown as typeof BroadcastChannel

interface TestCardData {
  title: string
  content: string
}

class TestCard extends MagicDrag<TestCardData> {
  static onEnterTab = jest.fn()

  private title: string
  private content: string

  constructor(element: HTMLElement, title = 'Test', content = 'Content') {
    super(element)
    this.title = title
    this.content = content
  }

  getClassName(): string {
    return 'TestCard'
  }

  onOtherTabDragStart = jest.fn()
  onOtherTabDragMove = jest.fn()
  onOtherTabDragEnd = jest.fn()

  serialize(): SerializedData<TestCardData> {
    return this.createSerializedData({
      title: this.title,
      content: this.content
    })
  }

  deserialize(data: SerializedData<TestCardData>): void {
    this.title = data.customData.title
    this.content = data.customData.content
  }

  getTitle(): string {
    return this.title
  }

  getContent(): string {
    return this.content
  }
}

describe('MagicDragManager', () => {
  beforeEach(() => {
    MockBroadcastChannel.reset()
    MagicDragManager.resetInstance()
    TestCard.onEnterTab.mockClear()
  })

  it('should create singleton instance', () => {
    const manager1 = MagicDragManager.getInstance()
    const manager2 = MagicDragManager.getInstance()

    expect(manager1).toBe(manager2)
  })

  it('should have unique tabId', () => {
    const manager = MagicDragManager.getInstance()

    expect(manager.tabId).toBeDefined()
    expect(typeof manager.tabId).toBe('string')
  })

  it('should register and unregister class', () => {
    const manager = MagicDragManager.getInstance()

    manager.registerClass('TestCard', TestCard)

    const element = document.createElement('div')
    const instance = new TestCard(element)

    expect(manager.getInstance(instance.instanceId)).toBe(instance)

    manager.unregisterInstance(instance.instanceId)
    expect(manager.getInstance(instance.instanceId)).toBeUndefined()
  })

  it('should track drag state', () => {
    const manager = MagicDragManager.getInstance()
    manager.registerClass('TestCard', TestCard)

    const element = document.createElement('div')
    const card = new TestCard(element, 'Title', 'Content')

    const initialState = manager.getDragState()
    expect(initialState.isDragging).toBe(false)
    expect(initialState.draggingInstanceId).toBeNull()

    card.destroy()
  })

  it('should call onEnterTab for registered class', () => {
    const manager = MagicDragManager.getInstance()
    manager.registerClass('TestCard', TestCard)

    const element = document.createElement('div')
    const card = new TestCard(element)

    const channel = new BroadcastChannel('magic-drag-channel')
    const serializedData = card.serialize()

    channel.postMessage({
      type: 'magic_drag_start',
      instanceId: card.instanceId,
      sourceTabId: 'external-tab',
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    channel.postMessage({
      type: 'magic_drag_enter_tab',
      instanceId: card.instanceId,
      sourceTabId: 'external-tab',
      targetTabId: manager.tabId,
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    expect(TestCard.onEnterTab).toHaveBeenCalledTimes(1)

    channel.close()
    card.destroy()
  })

  it('should warn and ignore unregistered class messages', () => {
    const manager = MagicDragManager.getInstance()
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const channel = new BroadcastChannel('magic-drag-channel')
    const message = {
      type: 'magic_drag_enter_tab',
      instanceId: 'unknown-instance',
      sourceTabId: 'external-tab',
      targetTabId: manager.tabId,
      payload: {
        serializedData: {
          instanceId: 'unknown-instance',
          className: 'UnknownCard',
          pose: {
            position: { x: 0, y: 0 },
            width: 0,
            height: 0
          },
          customData: null
        },
        timestamp: Date.now()
      }
    }

    channel.postMessage(message)

    expect(warnSpy).toHaveBeenCalled()
    expect(TestCard.onEnterTab).not.toHaveBeenCalled()

    warnSpy.mockRestore()
    channel.close()
  })
})

describe('MagicDrag', () => {
  beforeEach(() => {
    MockBroadcastChannel.reset()
    MagicDragManager.resetInstance()
    const manager = MagicDragManager.getInstance()
    manager.registerClass('TestCard', TestCard)
  })

  it('should create instance with unique id', () => {
    const element = document.createElement('div')
    const card = new TestCard(element)

    expect(card.instanceId).toBeDefined()
    expect(typeof card.instanceId).toBe('string')

    card.destroy()
  })

  it('should serialize data correctly', () => {
    const element = document.createElement('div')
    const card = new TestCard(element, 'My Title', 'My Content')

    const serialized = card.serialize()

    expect(serialized.instanceId).toBe(card.instanceId)
    expect(serialized.className).toBe('TestCard')
    expect(serialized.customData.title).toBe('My Title')
    expect(serialized.customData.content).toBe('My Content')

    card.destroy()
  })

  it('should deserialize data correctly', () => {
    const element = document.createElement('div')
    const card = new TestCard(element)

    const serializedData: SerializedData<TestCardData> = {
      instanceId: 'other-id',
      className: 'TestCard',
      pose: {
        position: { x: 100, y: 200 },
        width: 50,
        height: 50
      },
      customData: {
        title: 'New Title',
        content: 'New Content'
      }
    }

    card.deserialize(serializedData)

    expect(card.getTitle()).toBe('New Title')
    expect(card.getContent()).toBe('New Content')

    card.destroy()
  })

  it('should be registered with manager on creation', () => {
    const manager = MagicDragManager.getInstance()
    const element = document.createElement('div')
    const card = new TestCard(element)

    expect(manager.getInstance(card.instanceId)).toBe(card)

    card.destroy()
    expect(manager.getInstance(card.instanceId)).toBeUndefined()
  })

  it('should receive other tab drag callbacks', () => {
    const element = document.createElement('div')
    const card = new TestCard(element)

    const channel = new BroadcastChannel('magic-drag-channel')
    const serializedData = card.serialize()

    channel.postMessage({
      type: 'magic_drag_start',
      instanceId: 'external-instance',
      sourceTabId: 'external-tab',
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    channel.postMessage({
      type: 'magic_drag_move',
      instanceId: 'external-instance',
      sourceTabId: 'external-tab',
      payload: {
        serializedData,
        screenPosition: { screenX: 100, screenY: 120 },
        timestamp: Date.now()
      }
    })

    channel.postMessage({
      type: 'magic_drag_end',
      instanceId: 'external-instance',
      sourceTabId: 'external-tab',
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    expect(card.onOtherTabDragStart).toHaveBeenCalledTimes(1)
    expect(card.onOtherTabDragMove).toHaveBeenCalledTimes(1)
    expect(card.onOtherTabDragEnd).toHaveBeenCalledTimes(1)

    channel.close()
    card.destroy()
  })

  it('should broadcast callbacks to all same-class instances', () => {
    const elementA = document.createElement('div')
    const elementB = document.createElement('div')
    const cardA = new TestCard(elementA)
    const cardB = new TestCard(elementB)

    const channel = new BroadcastChannel('magic-drag-channel')
    const serializedData = cardA.serialize()

    channel.postMessage({
      type: 'magic_drag_start',
      instanceId: 'external-instance',
      sourceTabId: 'external-tab',
      payload: {
        serializedData,
        timestamp: Date.now()
      }
    })

    expect(cardA.onOtherTabDragStart).toHaveBeenCalledTimes(1)
    expect(cardB.onOtherTabDragStart).toHaveBeenCalledTimes(1)

    channel.close()
    cardA.destroy()
    cardB.destroy()
  })

  it('should unregister instance on destroy', () => {
    const manager = MagicDragManager.getInstance()
    const element = document.createElement('div')
    const card = new TestCard(element)

    expect(manager.getInstance(card.instanceId)).toBe(card)

    card.destroy()
    expect(manager.getInstance(card.instanceId)).toBeUndefined()
  })

  it('should have onAbort hook available for override', () => {
    let abortCalled = false

    class TestCardWithAbort extends TestCard {
      protected onAbort(_screenPosition: ScreenPosition): void {
        abortCalled = true
      }

      triggerAbort(): void {
        this.onAbort({ screenX: 0, screenY: 0 })
      }
    }

    const element = document.createElement('div')
    const card = new TestCardWithAbort(element)

    card.triggerAbort()

    expect(abortCalled).toBe(true)
    card.destroy()
  })

  it('should allow missing optional extensions without errors', () => {
    class MinimalCard extends MagicDrag<TestCardData> {
      static channelName = 'minimal-card-channel'

      getClassName(): string {
        return 'MinimalCard'
      }

      serialize(): SerializedData<TestCardData> {
        return this.createSerializedData({ title: 'a', content: 'b' })
      }

      deserialize(_data: SerializedData<TestCardData>): void {}
    }

    const manager = MagicDragManager.getInstance()
    manager.registerClass('MinimalCard', MinimalCard)

    const element = document.createElement('div')
    const card = new MinimalCard(element)

    const channel = new BroadcastChannel('minimal-card-channel')
    channel.postMessage({
      type: 'magic_drag_start',
      instanceId: 'external-instance',
      sourceTabId: 'external-tab',
      payload: {
        serializedData: card.serialize(),
        timestamp: Date.now()
      }
    })

    expect(card.instanceId).toBeDefined()

    channel.close()
    card.destroy()
  })
})

/**
 * @jest-environment jsdom
 */

import { MagicDrag, MagicDragManager, type SerializedData } from '../magic-drag'

class MockBroadcastChannel {
  name: string
  onmessage: ((event: MessageEvent) => void) | null = null
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
        if (channel !== this && channel.onmessage) {
          channel.onmessage(new MessageEvent('message', { data }))
        }
      }
    }
  }

  close(): void {
    MockBroadcastChannel.channels.get(this.name)?.delete(this)
  }

  static reset(): void {
    this.channels.clear()
  }
}

global.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel

interface TestCardData {
  title: string
  content: string
}

class TestCard extends MagicDrag<TestCardData> {
  private title: string
  private content: string

  constructor(element: HTMLElement, title = 'Test', content = 'Content') {
    super(element)
    this.title = title
    this.content = content
  }

  protected getClassName(): string {
    return 'TestCard'
  }

  serialize(): SerializedData<TestCardData> {
    return this.createSerializedData({
      title: this.title,
      content: this.content,
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
})

describe('MagicDrag', () => {
  beforeEach(() => {
    MockBroadcastChannel.reset()
    MagicDragManager.resetInstance()
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
        height: 50,
      },
      customData: {
        title: 'New Title',
        content: 'New Content',
      },
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

  it('should remove element on destroy', () => {
    const container = document.createElement('div')
    const element = document.createElement('div')
    container.appendChild(element)

    const card = new TestCard(element)
    expect(container.contains(element)).toBe(true)

    card.destroy()
    expect(container.contains(element)).toBe(false)
  })
})

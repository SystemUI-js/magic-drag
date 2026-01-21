import {
  MagicDrag,
  MagicDragManager,
  ScreenPosition,
  type SerializedData
} from './magic-drag'

interface CardData {
  title: string
  content: string
  color: string
}

class DemoCard extends MagicDrag<CardData> {
  private title: string
  private content: string
  private color: string
  private initialLeft: string = ''
  private initialTop: string = ''
  private initialDisplay: string = ''

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
  }

  private render(): void {
    this.element.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">${this.title}</h3>
      <p style="margin: 0; font-size: 14px; opacity: 0.8;">${this.content}</p>
    `
  }

  private applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      width: '200px',
      padding: '16px',
      borderRadius: '12px',
      background: this.color,
      color: '#fff',
      cursor: 'grab',
      userSelect: 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'box-shadow 0.2s'
    })
  }

  protected onDragMove(
    _screenPosition: ScreenPosition,
    _isLeaveTab: boolean
  ): void {
    // console.log(_screenPosition, _isLeaveTab)
  }
  protected onDragEnd(
    _screenPosition: ScreenPosition,
    _isLeaveTab: boolean
  ): void {
    console.log('[onDragEnd]', _screenPosition, _isLeaveTab)
  }

  public onDragInInternal(): void {
    this.applyStyles()
  }

  protected onDragStart(_screenPosition: ScreenPosition): void {
    this.initialLeft = this.element.style.left
    this.initialTop = this.element.style.top
    this.initialDisplay = this.element.style.display
    console.log(`[onDragStart]`)
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
    console.log('onAbort', _screenPosition)
    this.goBackToDragStart()
  }
}

const manager = MagicDragManager.getInstance()
manager.registerClass('DemoCard', DemoCard)

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <style>
      :root { color-scheme: light dark; }
      body {
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        margin: 0;
        padding: 2rem;
        min-height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      }
      .info {
        color: #fff;
        margin-bottom: 2rem;
        padding: 1rem;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
      }
      .info h1 { margin: 0 0 0.5rem 0; }
      .info p { margin: 0; opacity: 0.8; }
      .tab-id {
        font-family: monospace;
        background: rgba(255,255,255,0.2);
        padding: 2px 6px;
        border-radius: 4px;
      }
    </style>
    <div class="info">
      <h1>Magic Drag Demo</h1>
      <p>Tab ID: <span class="tab-id">${manager.tabId.slice(0, 8)}...</span></p>
      <p>Drag cards between browser tabs! Open this page in multiple tabs to test.</p>
    </div>
    <div id="card-container" style="position: relative; height: 400px;"></div>
  `

  const container = document.querySelector<HTMLDivElement>('#card-container')

  if (container) {
    const cards = [
      {
        title: 'Card 1',
        content: 'Drag me to another tab!',
        color: '#6366f1',
        x: 50,
        y: 50
      },
      {
        title: 'Card 2',
        content: 'I can travel between tabs',
        color: '#ec4899',
        x: 300,
        y: 50
      },
      {
        title: 'Card 3',
        content: 'Multi-tab drag & drop',
        color: '#14b8a6',
        x: 550,
        y: 50
      }
    ]

    cards.forEach(({ title, content, color, x, y }) => {
      const element = document.createElement('div')
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      container.appendChild(element)
      new DemoCard(element, title, content, color)
    })
  }
}

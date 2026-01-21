# Quickstart

## Goal
通过 Manager 注册 MagicDrag 子类，使用静态 channelName 进行跨 Tab 通信，并在目标 Tab 触发 onEnterTab 与其他 Tab 拖拽回调。

## Steps
1. 定义 MagicDrag 子类（包含静态 channelName 与序列化逻辑）
2. 在应用启动阶段注册子类到 Manager
3. 实例化子类并启用拖拽
4. 跨 Tab 拖拽触发回调

## Example

```ts
import { MagicDrag, MagicDragManager } from 'magic-drag'

interface CardData {
  title: string
}

class MyCard extends MagicDrag<CardData> {
  static readonly channelName = 'my-card-channel'

  protected getClassName(): string {
    return 'MyCard'
  }

  serialize() {
    return this.createSerializedData({ title: 'hello' })
  }

  deserialize(data) {
    // custom logic
  }

  static onEnterTab() {
    // called when drag enters current tab
  }

  onOtherTabDragStart() {}
  onOtherTabDragMove() {}
  onOtherTabDragEnd() {}
}

const manager = MagicDragManager.getInstance()
manager.registerClass('MyCard', MyCard)

const element = document.createElement('div')
document.body.appendChild(element)
const instance = new MyCard(element)
```

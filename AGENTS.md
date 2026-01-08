# Magic Drag

## 项目概述

Magic Drag 是一个跨浏览器标签页拖拽库，允许用户将元素从一个浏览器 Tab 拖动到另一个 Tab。

## 核心特性

- **跨 Tab 拖拽**：支持在不同浏览器标签页之间拖拽元素
- **BroadcastChannel 通信**：使用 BroadcastChannel API 实现 Tab 间实时通信
- **序列化/反序列化**：支持元素状态的序列化传输和反序列化重建
- **预览元素**：拖拽进入目标 Tab 时自动创建预览元素
- **多输入支持**：支持鼠标、触摸屏和手写笔操作
- **TypeScript 原生支持**：完整的类型定义

## 技术架构

### 核心组件

| 组件               | 职责                                          |
| ------------------ | --------------------------------------------- |
| `MagicDrag`        | 抽象基类，使用者需继承实现序列化/反序列化逻辑 |
| `MagicDragManager` | 全局单例管理器，协调多实例和跨 Tab 通信       |

### 依赖

- `@system-ui-js/multi-drag`：提供基础拖拽能力

### 通信协议

使用 `BroadcastChannel API` 实现跨 Tab 通信，消息类型包括：

- `DRAG_START`：开始拖拽
- `DRAG_MOVE`：拖拽移动
- `DRAG_END`：拖拽结束
- `DRAG_ENTER_TAB`：进入目标 Tab
- `DRAG_LEAVE_TAB`：离开源 Tab
- `DRAG_DROP`：放置到目标 Tab
- `TAB_ACTIVATED`：Tab 激活通知
- `HEARTBEAT`：心跳检测

### 跨 Tab 拖动流程

```
Tab A (源)                                    Tab B (目标)
────────                                      ────────
用户开始拖动元素
    │
    ├─── DRAG_START ──────────────────────────▶ 收到拖动开始消息
    │                                              │
    ├─── DRAG_MOVE (持续) ────────────────────▶ 更新预览位置
    │                                              │
用户将光标移到 Tab B
    │
    ├─── DRAG_LEAVE ──────────────────────────▶
    │
                                               用户继续在 Tab B 拖动
                                                   │
    ◀─── TAB_ACTIVATED ───────────────────────────┤
         (Tab B 激活，创建预览元素)                 │
                                                   │
                                               用户释放
                                                   │
    ◀─── DRAG_DROP ───────────────────────────────┤
         (原 Tab 销毁实例)                          │
                                               Tab B 反序列化创建实例
```

## 使用方式

### 安装

```bash
yarn add magic-drag
```

### 基本用法

```typescript
import { MagicDrag, MagicDragManager, type SerializedData } from 'magic-drag'

interface CardData {
  title: string
  content: string
}

class MyCard extends MagicDrag<CardData> {
  private title: string
  private content: string

  constructor(element: HTMLElement, title: string, content: string) {
    super(element)
    this.title = title
    this.content = content
  }

  protected getClassName(): string {
    return 'MyCard'
  }

  serialize(): SerializedData<CardData> {
    return this.createSerializedData({
      title: this.title,
      content: this.content
    })
  }

  deserialize(data: SerializedData<CardData>): void {
    this.title = data.customData.title
    this.content = data.customData.content
    this.render()
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="card">
        <h3>${this.title}</h3>
        <p>${this.content}</p>
      </div>
    `
  }
}

// 注册类到管理器
const manager = MagicDragManager.getInstance()
manager.registerClass('MyCard', MyCard)

// 创建可拖拽元素
const element = document.createElement('div')
document.body.appendChild(element)
const card = new MyCard(element, 'Hello', 'World')
```

## 开发指南

### 目录结构

```
src/
├── magic-drag/
│   ├── index.ts           # 导出入口
│   ├── types.ts           # 类型定义
│   ├── MagicDrag.ts       # 抽象基类
│   └── MagicDragManager.ts # 全局管理器
└── __tests__/
    └── magic-drag.test.ts  # 单元测试
```

### 命令

```bash
yarn dev          # 启动开发服务器
yarn build:lib    # 构建库
yarn test         # 运行测试
yarn type-check   # 类型检查
yarn lint         # 代码检查
yarn format       # 代码格式化
```

## 注意事项

1. 使用者需要继承 `MagicDrag` 类并实现 `serialize()`、`deserialize()` 和 `getClassName()` 方法
2. 需要在每个 Tab 中调用 `MagicDragManager.registerClass()` 注册可拖拽类
3. BroadcastChannel 只在同源（Same Origin）的 Tab 之间工作
4. 跨 Tab 传输的数据必须是可序列化的（无法传输函数、DOM 元素等）

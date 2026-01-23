# Quickstart: Demo MagicDrag 展示完善

## Purpose

本 Quickstart 描述 demo 需要展示的跨 Tab 拖拽流程与关键行为。

## Core Flow

1. 打开同源的两个 Tab，加载 demo。
2. 在源 Tab 开始拖拽卡片，广播 DRAG_START。
3. 目标 Tab 收到开始通知，立即实例化卡片并进入预览/展示状态。
4. 在目标 Tab 结束拖拽时，通知源 Tab 销毁对应卡片。
5. 反复跨 Tab 拖拽，验证无残留卡片或重复实例。

## Key Behaviors

- 拖拽开始即广播通知。
- 目标 Tab 进入时创建卡片实例。
- 非源 Tab 触发结束时源 Tab 清理实例。
- Demo UI/日志尽可能展示 MagicDrag 基类方法与事件。
- 事件日志面板展示方法名、时间与关键参数摘要。

## Manual Verification Steps

1. 在同源浏览器打开两个 Tab，保持可见。
2. 在 Tab A 拖拽任一卡片并保持拖拽状态。
3. 切换到 Tab B，确认卡片在日志面板出现 DRAG_START/DRAG_MOVE/DRAG_ENTER_TAB 记录。
4. 在 Tab B 释放鼠标，确认卡片实例保留且 Tab A 实例被移除。
5. 再次跨 Tab 拖拽，确认没有重复或残留卡片。
6. 查看日志面板，确认 onDragStart/onDragMove/onDragEnd/onAbort/onEnterTab/onLeaveTab 记录齐全。

## Self-Check Log (2026-01-23)

- [ ] 双 Tab 拖拽开始即实例化，日志记录 DRAG_START/DRAG_MOVE
- [ ] Tab B 进入后预览状态正确，DRAG_ENTER_TAB/DRAG_LEAVE_TAB 有记录
- [ ] Tab B 释放后 Tab A 卡片销毁，无残留实例
- [ ] DRAG_ABORT 可清理预览卡片
- [ ] 日志面板显示序列化/反序列化摘要与 Tab/Instance ID

> 状态: 未执行（无浏览器验证环境，需手动完成）
> 记录时间: 2026-01-23

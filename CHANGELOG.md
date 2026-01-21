# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [UnReleased]

### Added
- MagicDrag 扩展点支持静态 onEnterTab 与实例 onOtherTabDrag* 回调
- 引入 coordinator 以解耦 MagicDrag 与 Manager 之间的直接依赖
- 新增跨 Tab 回调与同类实例广播测试覆盖
- 支持按通道名注册事件监听器，并提供全局事件分发接口
- MagicDrag 子类可通过静态 channelName 指定跨标签页通信通道

### Changed
- Manager 按 className/channelName 管理注册表并拒绝通道冲突
- BroadcastChannel 不可用时降级为单 Tab 行为并记录诊断日志
- 未注册 className 的跨 Tab 消息直接忽略并记录 warning
- Manager 统一分发拖拽信号并在无监听器时记录可观测日志
- 跨标签页拖拽 activeTabId 在拖拽开始与进入目标标签页时更新

### Fixed
- 测试覆盖完整的跨 Tab 进入与回调流程
- 移除无用的测试文件 `src/__tests__/sum.test.ts`
- 修复 tsconfig.build.json 配置冲突：将 `noEmit: false` 改为 `emitDeclarationOnly: true`，解决 `allowImportingTsExtensions` 只能在 `noEmit` 或 `emitDeclarationOnly` 时使用的 TypeScript 编译错误
- 修复 ESLint 错误：将 `MagicDrag.channelName` 改为 `readonly`，符合 sonarjs/public-static-readonly 规则
- 修复 ESLint 错误：移除冗余的类型别名 `MagicDragAnyEventListenerStore`，符合 sonarjs/redundant-type-aliases 规则
- 修复拖出所有 Tab 时无法触发 DRAG_ABORT 的问题：在 handleExternalDragMove 中，当鼠标离开当前 Tab 时，如果 `activeTabId` 等于当前 Tab ID，则将其设为 null，确保 MagicDrag.handleDragEnd 能正确判断 abort 条件
- 修复跨 Tab 拖拽时 `onEnterTab` 回调不会被调用的问题：移除 `handleExternalDragEnterTab` 中不必要的 `sourceTabId` 守卫检查，因为该消息已通过初始过滤且语义本身就要求目标 Tab 响应进入事件
- 修复 ESLint 错误：将测试文件中的 `TestCard.onEnterTab` 和 `MinimalCard.channelName` 改为 `readonly`，符合 sonarjs/public-static-readonly 规则
- 修复 TypeScript 类型错误：将 `DemoCard.getClassName()` 从 `protected` 改为 `public`，以匹配基类中的 `public abstract getClassName()` 声明

## 0.1.0 - 2025-11-16

## Added

- Project initialized with Vite + TypeScript
- ESLint (Flat config, v9) + Prettier
- Jest (ts-jest, jsdom) with sample test
- Yarn as the package manager
- Basic app entry (index.html, src/main.ts)
- CHANGELOG, .editorconfig, .gitignore, Prettier config

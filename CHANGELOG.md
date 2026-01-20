# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## Unreleased

### Added
- 支持按通道名注册事件监听器，并提供全局事件分发接口
- MagicDrag 子类可通过静态 channelName 指定跨标签页通信通道

### Changed
- Manager 统一分发拖拽信号并在无监听器时记录可观测日志
- 跨标签页拖拽 activeTabId 在拖拽开始与进入目标标签页时更新

### Fixed
- 移除无用的测试文件 `src/__tests__/sum.test.ts`
- 修复 tsconfig.build.json 配置冲突：将 `noEmit: false` 改为 `emitDeclarationOnly: true`，解决 `allowImportingTsExtensions` 只能在 `noEmit` 或 `emitDeclarationOnly` 时使用的 TypeScript 编译错误
- 修复 ESLint 错误：将 `MagicDrag.channelName` 改为 `readonly`，符合 sonarjs/public-static-readonly 规则
- 修复 ESLint 错误：移除冗余的类型别名 `MagicDragAnyEventListenerStore`，符合 sonarjs/redundant-type-aliases 规则
- 修复拖出所有 Tab 时无法触发 DRAG_ABORT 的问题：在 handleExternalDragMove 中，当鼠标离开当前 Tab 时，如果 `activeTabId` 等于当前 Tab ID，则将其设为 null，确保 MagicDrag.handleDragEnd 能正确判断 abort 条件

## 0.1.0 - 2025-11-16

## Added

- Project initialized with Vite + TypeScript
- ESLint (Flat config, v9) + Prettier
- Jest (ts-jest, jsdom) with sample test
- Yarn as the package manager
- Basic app entry (index.html, src/main.ts)
- CHANGELOG, .editorconfig, .gitignore, Prettier config

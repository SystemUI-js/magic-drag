# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## Unreleased

### Fixed
- 移除无用的测试文件 `src/__tests__/sum.test.ts`
- 修复 tsconfig.build.json 配置冲突：将 `noEmit: false` 改为 `emitDeclarationOnly: true`，解决 `allowImportingTsExtensions` 只能在 `noEmit` 或 `emitDeclarationOnly` 时使用的 TypeScript 编译错误

## 0.1.0 - 2025-11-16

## Added

- Project initialized with Vite + TypeScript
- ESLint (Flat config, v9) + Prettier
- Jest (ts-jest, jsdom) with sample test
- Yarn as the package manager
- Basic app entry (index.html, src/main.ts)
- CHANGELOG, .editorconfig, .gitignore, Prettier config

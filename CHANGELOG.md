# CHANGELOG

所有重要的更改都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/) 规范。

## [0.1.0] - 2025-12-30

### 新增
- 初始化 MagicDrag 库项目
- 实现核心抽象类 `MagicDrag<T, U>`，支持跨浏览器 Tab 拖拽数据传输
- 添加 BroadcastChannel 工具类 `BroadcastChannelClient`，封装跨 Tab 通信功能
- 创建完整的 TypeScript 类型定义系统
- 实现抽象方法：`serialize`、`parse`、`render`，供子类实现
- 添加静态方法：`bind`、`unbind`、`unbindAll`，管理跨 Tab 监听
- 添加 Tab ID 生成和管理机制，使用 sessionStorage 持久化
- 实现拖拽状态管理：`DragState.Idle` 和 `DragState.Dragging`
- 支持自定义频道名称配置
- 添加单元测试覆盖核心功能
- 添加 E2E 测试验证跨 Tab 交互
- 创建 demo 页面展示库的使用方法

### 测试
- 添加 Jest 配置，支持 TypeScript 测试
- 单元测试覆盖：
  - MagicDrag 核心功能测试
  - BroadcastChannel 工具类测试
- E2E 测试验证跨 Tab 拖拽交互
- 使用 `@playwright/test` 进行端到端测试
- 配置 jsdom 测试环境

### 构建配置
- 配置 TypeScript 编译选项（ES2020, ESNext 模块）
- 设置 Jest 测试框架
- 配置源码映射和声明文件生成
- 支持 CommonJS 和 ES 模块双格式输出

### 文档
- 添加完整的 JSDoc 注释
- 提供使用示例和 API 文档
- 包含类型定义的详细说明

### 依赖
- `@system-ui-js/multi-drag`：基础拖拽功能
- `@playwright/test`：E2E 测试框架
- `@types/jest`、`@types/node`：类型定义
- `jest`、`ts-jest`：单元测试框架
- `typescript`：TypeScript 编译

### 性能优化
- 防止重复绑定频道
- 正确清理 BroadcastChannel 资源
- 实现 `destroy()` 方法释放实例资源
- 使用 Set 和 Map 管理活跃实例

### 错误处理
- 参数验证（element、getData 函数检查）
- 序列化/反序列化错误处理
- sessionStorage 不可用时的降级处理
- 优雅处理跨 Tab 消息过滤

## [0.0.1] - 2025-12-29

### 新增
- 项目初始化
- 基础项目结构创建